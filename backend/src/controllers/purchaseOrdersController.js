const { AppDataSource } = require('../config/dataSource')

function safeErrorMessage(err, fallback) {
    if (!err) return fallback
    if (typeof err.detail === 'string' && err.detail.trim()) return err.detail
    if (typeof err.message === 'string' && err.message.trim()) return err.message
    return fallback
}

function toNumberOrNull(value) {
    if (value === null || value === undefined || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
}

function mapPoEntity(po) {
    const pr = po?.purchaseRequest
    const requesterEmail = pr?.requester?.email || null
    const prId = pr?.pr_id ?? po?.pr_id ?? null

    return {
        id: po.po_id,
        prId,
        poNumber: po.po_number,
        supplierName: po?.supplier?.supplier_name || 'Supplier',
        issueDate: po.issue_date,
        expectedDeliveryDate: po.expected_delivery_date,
        actualDeliveryDate: po.actual_delivery_date,
        amount: toNumberOrNull(po.po_amount) || 0,
        status: po.po_status,
        paymentStatus: po.payment_status,
        archived: Boolean(po.archived),
        deleted: Boolean(po.deleted),
        requesterEmail,
    }
}

async function generatePoNumber() {
    const poRepo = AppDataSource.getRepository('PurchaseOrder')
    const year = new Date().getFullYear()
    const count = await poRepo.count()
    const seq = count + 1
    return `PO-${year}-${String(seq).padStart(4, '0')}`
}

async function listPurchaseOrders(req, res) {
    try {
        const poRepo = AppDataSource.getRepository('PurchaseOrder')

        const where = {}
        if (req.query.includeDeleted !== 'true') where.deleted = false

        if (req.auth.role !== 'Admin') {
            where.purchaseRequest = { requester: { user_id: req.auth.userId } }
        }

        const pos = await poRepo.find({
            where,
            relations: {
                supplier: true,
                purchaseRequest: {
                    requester: true,
                },
            },
            order: { po_id: 'DESC' },
        })

        res.json(pos.map(mapPoEntity))
    } catch (e) {
        console.error('listPurchaseOrders failed', e)
        res.status(500).json({ message: 'Failed to list purchase orders' })
    }
}

async function getPurchaseOrder(req, res) {
    try {
        const id = Number(req.params.id)
        if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' })

        const poRepo = AppDataSource.getRepository('PurchaseOrder')
        const po = await poRepo.findOne({
            where: { po_id: id },
            relations: {
                supplier: true,
                deliveries: true,
                purchaseRequest: {
                    requester: true,
                },
            },
        })

        if (!po) return res.status(404).json({ message: 'Not found' })

        if (req.auth.role !== 'Admin' && po?.purchaseRequest?.requester?.user_id !== req.auth.userId) {
            return res.status(403).json({ message: 'Forbidden' })
        }

        res.json({
            ...mapPoEntity(po),
            deliveries: (po.deliveries || []).map((d) => ({
                id: d.delivery_id,
                deliveryDate: d.delivery_date,
                quantityReceived: d.quantity_received,
                conditionStatus: d.condition_status,
                remarks: d.delivery_remarks,
            })),
        })
    } catch (e) {
        console.error('getPurchaseOrder failed', e)
        res.status(500).json({ message: 'Failed to fetch purchase order' })
    }
}

async function createPurchaseOrder(req, res) {
    try {
        const { prId, supplierName, expectedDeliveryDate, amount } = req.body || {}

        const pr_id = Number(prId)
        if (!Number.isFinite(pr_id)) return res.status(400).json({ message: 'prId is required' })

        const prRepo = AppDataSource.getRepository('PurchaseRequest')
        const poRepo = AppDataSource.getRepository('PurchaseOrder')
        const supplierRepo = AppDataSource.getRepository('Supplier')
        const bidRepo = AppDataSource.getRepository('Bid')

        const pr = await prRepo.findOne({ where: { pr_id } })
        if (!pr) return res.status(404).json({ message: 'Purchase request not found' })

        if (pr.status !== 'Approved') {
            return res.status(400).json({ message: 'Request must be Approved first' })
        }

        const existing = await poRepo.findOne({
            where: {
                deleted: false,
                purchaseRequest: { pr_id },
            },
        })
        if (existing) {
            return res.status(400).json({ message: 'Purchase order already exists for this request' })
        }

        const name = (supplierName || '').trim() || 'Supplier'
        let supplier = await supplierRepo.findOne({ where: { supplier_name: name } })
        if (!supplier) {
            supplier = await supplierRepo.save({
                supplier_name: name,
                is_active: true,
            })
        }

        const bid = await bidRepo.save({
            purchaseRequest: pr,
            supplier,
            bid_date: new Date(),
            quoted_price: toNumberOrNull(amount) || toNumberOrNull(pr.total_amount) || 0,
            delivery_period_days: 14,
            bid_status: 'Awarded',
            bid_document_path: null,
        })

        const poNumber = await generatePoNumber()

        const po = await poRepo.save({
            po_number: poNumber,
            issue_date: new Date(),
            expected_delivery_date: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
            actual_delivery_date: null,
            po_amount: toNumberOrNull(amount) || toNumberOrNull(pr.total_amount) || 0,
            po_status: 'Issued',
            payment_status: 'Pending',
            po_document_path: null,
            archived: false,
            deleted: false,
            purchaseRequest: pr,
            bid,
            supplier,
        })

        pr.status = 'Processing'
        await prRepo.save(pr)

        const auditRepo = AppDataSource.getRepository('AuditLog')
        await auditRepo.save({
            action_type: 'Created',
            old_value: null,
            new_value: `Created ${poNumber}`,
            purchaseRequest: pr,
            purchaseOrder: po,
            user: { user_id: req.auth.userId },
        })

        const saved = await poRepo.findOne({
            where: { po_id: po.po_id },
            relations: {
                supplier: true,
                purchaseRequest: { requester: true },
            },
        })

        res.status(201).json(mapPoEntity(saved))
    } catch (e) {
        console.error('createPurchaseOrder failed', e)
        const message = process.env.NODE_ENV === 'production'
            ? 'Failed to create purchase order'
            : safeErrorMessage(e, 'Failed to create purchase order')
        res.status(500).json({ message })
    }
}

async function updatePurchaseOrderFlags(req, res) {
    try {
        const id = Number(req.params.id)
        if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' })

        const { archived, deleted } = req.body || {}

        const poRepo = AppDataSource.getRepository('PurchaseOrder')
        const po = await poRepo.findOne({
            where: { po_id: id },
            relations: {
                purchaseRequest: true,
            },
        })
        if (!po) return res.status(404).json({ message: 'Not found' })

        if (archived !== undefined) po.archived = Boolean(archived)
        if (deleted !== undefined) po.deleted = Boolean(deleted)

        await poRepo.save(po)

        const auditRepo = AppDataSource.getRepository('AuditLog')
        await auditRepo.save({
            action_type: 'Updated',
            old_value: null,
            new_value: `flags: archived=${Boolean(po.archived)} deleted=${Boolean(po.deleted)}`,
            purchaseRequest: po.purchaseRequest,
            purchaseOrder: po,
            user: { user_id: req.auth.userId },
        })

        const saved = await poRepo.findOne({
            where: { po_id: id },
            relations: {
                supplier: true,
                purchaseRequest: { requester: true },
            },
        })

        res.json(mapPoEntity(saved))
    } catch (e) {
        console.error('updatePurchaseOrderFlags failed', e)
        res.status(500).json({ message: 'Failed to update flags' })
    }
}

module.exports = {
    listPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrderFlags,
}
