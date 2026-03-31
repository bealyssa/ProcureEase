const { AppDataSource } = require('../config/dataSource')

function safeErrorMessage(err, fallback) {
    if (!err) return fallback
    if (typeof err.detail === 'string' && err.detail.trim()) return err.detail
    if (typeof err.message === 'string' && err.message.trim()) return err.message
    return fallback
}

function mapPrStatusToUi(status) {
    if (status === 'Submitted') return 'Pending Approval'
    return status || 'Draft'
}

function mapUiStatusToDb(status) {
    if (status === 'Pending Approval') return 'Submitted'
    return status
}

function mapPriorityToUi(priority) {
    return priority || 'Low'
}

function toNumberOrNull(value) {
    if (value === null || value === undefined || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
}

async function ensureDefaultCategoryId() {
    const categoryRepo = AppDataSource.getRepository('ItemCategory')
    const existing = await categoryRepo.findOne({ where: { category_name: 'Medical Supplies' } })
    if (existing) return existing.category_id

    const any = await categoryRepo.find({ take: 1 })
    if (any && any.length) return any[0].category_id

    const created = await categoryRepo.save({
        category_name: 'Medical Supplies',
        description: 'General medical consumables',
    })
    return created.category_id
}

async function generatePrNumber() {
    const prRepo = AppDataSource.getRepository('PurchaseRequest')
    const year = new Date().getFullYear()
    const count = await prRepo.count()
    const seq = count + 1
    return `PR-${year}-${String(seq).padStart(4, '0')}`
}

function mapPrEntity(pr) {
    const requesterEmail = pr?.requester?.email || null

    const items = (pr?.items || []).map((it) => ({
        id: it.pr_item_id,
        name: it.item_name,
        quantity: it.quantity,
        unit: it.unit_of_measure || '',
        unitPrice: toNumberOrNull(it.unit_price) || 0,
    }))

    return {
        id: pr.pr_id,
        prNumber: pr.pr_number,
        requesterEmail,
        purpose: pr.description || '',
        urgency: mapPriorityToUi(pr.priority_level),
        items,
        status: mapPrStatusToUi(pr.status),
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        adminRemarks: pr.admin_remarks ?? null,
        approvedAt: null,
        rejectedAt: null,
        archived: Boolean(pr.archived),
        deleted: Boolean(pr.deleted),
        totalAmount: toNumberOrNull(pr.total_amount) || 0,
    }
}

async function listPurchaseRequests(req, res) {
    try {
        const prRepo = AppDataSource.getRepository('PurchaseRequest')

        const where = {}
        if (req.query.includeDeleted !== 'true') where.deleted = false

        if (req.auth.role !== 'Admin') {
            where.requester = { user_id: req.auth.userId }
        }

        const prs = await prRepo.find({
            where,
            relations: {
                requester: true,
                items: true,
            },
            order: { pr_id: 'DESC' },
        })

        res.json(prs.map(mapPrEntity))
    } catch {
        res.status(500).json({ message: 'Failed to list purchase requests' })
    }
}

async function getPurchaseRequest(req, res) {
    try {
        const id = Number(req.params.id)
        if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' })

        const prRepo = AppDataSource.getRepository('PurchaseRequest')
        const pr = await prRepo.findOne({
            where: { pr_id: id },
            relations: {
                requester: true,
                items: true,
            },
        })

        if (!pr) return res.status(404).json({ message: 'Not found' })

        if (req.auth.role !== 'Admin' && pr.requester?.user_id !== req.auth.userId) {
            return res.status(403).json({ message: 'Forbidden' })
        }

        res.json(mapPrEntity(pr))
    } catch {
        res.status(500).json({ message: 'Failed to fetch purchase request' })
    }
}

async function createPurchaseRequest(req, res) {
    try {
        const { purpose, urgency, items } = req.body || {}

        if (!purpose || typeof purpose !== 'string' || !purpose.trim()) {
            return res.status(400).json({ message: 'Purpose is required' })
        }

        const normalizedItems = Array.isArray(items) ? items : []
        const hasValidItem = normalizedItems.some(
            (it) => (it?.name || '').trim() && Number(it?.quantity) > 0,
        )
        if (!hasValidItem) {
            return res.status(400).json({ message: 'At least one valid item is required' })
        }

        const userRepo = AppDataSource.getRepository('User')
        const user = await userRepo.findOne({
            where: { user_id: req.auth.userId },
            relations: { department: true },
        })
        if (!user) return res.status(401).json({ message: 'Invalid user' })
        if (!user.department) return res.status(400).json({ message: 'User has no department' })

        const categoryId = await ensureDefaultCategoryId()
        const categoryRepo = AppDataSource.getRepository('ItemCategory')
        const category = await categoryRepo.findOne({ where: { category_id: Number(categoryId) } })
        if (!category) return res.status(400).json({ message: 'Item category not found' })
        const prNumber = await generatePrNumber()

        const prRepo = AppDataSource.getRepository('PurchaseRequest')
        const itemRepo = AppDataSource.getRepository('PrItem')

        const totalAmount = normalizedItems.reduce((sum, it) => {
            const qty = Number(it?.quantity || 0)
            const unitPrice = Number(it?.unitPrice || 0)
            return sum + (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0)
        }, 0)

        const pr = await prRepo.save({
            pr_number: prNumber,
            request_date: new Date(),
            description: purpose.trim(),
            total_amount: totalAmount,
            status: 'Submitted',
            priority_level: urgency || 'Low',
            admin_remarks: null,
            archived: false,
            deleted: false,
            department: user.department,
            requester: user,
            category,
        })

        const prItems = normalizedItems
            .filter((it) => (it?.name || '').trim() && Number(it?.quantity) > 0)
            .map((it) => {
                const qty = Number(it.quantity || 0)
                const unitPrice = Number(it.unitPrice || 0)
                return {
                    purchaseRequest: pr,
                    item_name: String(it.name).trim(),
                    item_description: null,
                    quantity: qty,
                    unit_of_measure: (it.unit || '').trim(),
                    unit_price: unitPrice,
                    total_price: qty * unitPrice,
                    specification: null,
                }
            })

        await itemRepo.save(prItems)

        const saved = await prRepo.findOne({
            where: { pr_id: pr.pr_id },
            relations: { requester: true, items: true },
        })

        const auditRepo = AppDataSource.getRepository('AuditLog')
        await auditRepo.save({
            action_type: 'Created',
            old_value: null,
            new_value: `Created ${prNumber}`,
            purchaseRequest: pr,
            purchaseOrder: null,
            user,
        })

        res.status(201).json(mapPrEntity(saved))
    } catch (e) {
        console.error('createPurchaseRequest failed', e)
        const message = process.env.NODE_ENV === 'production'
            ? 'Failed to create purchase request'
            : safeErrorMessage(e, 'Failed to create purchase request')
        res.status(500).json({ message })
    }
}

async function updatePurchaseRequestStatus(req, res) {
    try {
        const id = Number(req.params.id)
        if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' })

        const { status, adminRemarks } = req.body || {}
        const dbStatus = mapUiStatusToDb(status)

        if (!dbStatus || typeof dbStatus !== 'string') {
            return res.status(400).json({ message: 'Status is required' })
        }

        const prRepo = AppDataSource.getRepository('PurchaseRequest')
        const pr = await prRepo.findOne({ where: { pr_id: id } })
        if (!pr) return res.status(404).json({ message: 'Not found' })

        const oldStatus = pr.status
        pr.status = dbStatus
        if (adminRemarks !== undefined) pr.admin_remarks = adminRemarks

        await prRepo.save(pr)

        const auditRepo = AppDataSource.getRepository('AuditLog')
        const actionType =
            dbStatus === 'Approved' ? 'Approved' : dbStatus === 'Rejected' ? 'Rejected' : 'Updated'
        await auditRepo.save({
            action_type: actionType,
            old_value: oldStatus,
            new_value: dbStatus,
            pr_id: pr.pr_id,
            po_id: null,
            user_id: req.auth.userId,
        })

        const saved = await prRepo.findOne({
            where: { pr_id: id },
            relations: { requester: true, items: true },
        })

        res.json(mapPrEntity(saved))
    } catch {
        res.status(500).json({ message: 'Failed to update status' })
    }
}

async function updatePurchaseRequestFlags(req, res) {
    try {
        const id = Number(req.params.id)
        if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' })

        const { archived, deleted } = req.body || {}

        const prRepo = AppDataSource.getRepository('PurchaseRequest')
        const pr = await prRepo.findOne({ where: { pr_id: id } })
        if (!pr) return res.status(404).json({ message: 'Not found' })

        if (archived !== undefined) pr.archived = Boolean(archived)
        if (deleted !== undefined) pr.deleted = Boolean(deleted)

        await prRepo.save(pr)

        const auditRepo = AppDataSource.getRepository('AuditLog')
        await auditRepo.save({
            action_type: 'Updated',
            old_value: null,
            new_value: `flags: archived=${Boolean(pr.archived)} deleted=${Boolean(pr.deleted)}`,
            pr_id: pr.pr_id,
            po_id: null,
            user_id: req.auth.userId,
        })

        const saved = await prRepo.findOne({
            where: { pr_id: id },
            relations: { requester: true, items: true },
        })

        res.json(mapPrEntity(saved))
    } catch {
        res.status(500).json({ message: 'Failed to update flags' })
    }
}

module.exports = {
    listPurchaseRequests,
    getPurchaseRequest,
    createPurchaseRequest,
    updatePurchaseRequestStatus,
    updatePurchaseRequestFlags,
}
