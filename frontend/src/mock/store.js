const STORE_KEY = 'pe_store_v1'

function uid() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

function nowIso() {
    return new Date().toISOString()
}

function readStore() {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
        return {
            nextRequestSeq: 1,
            nextPoSeq: 1,
            requests: [],
            purchaseOrders: [],
            auditLogs: [],
        }
    }

    try {
        return JSON.parse(raw)
    } catch {
        return {
            nextRequestSeq: 1,
            nextPoSeq: 1,
            requests: [],
            purchaseOrders: [],
            auditLogs: [],
        }
    }
}

function writeStore(store) {
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function makePrNumber(seq) {
    const year = new Date().getFullYear()
    return `PR-${year}-${String(seq).padStart(4, '0')}`
}

function makePoNumber(seq) {
    const year = new Date().getFullYear()
    return `PO-${year}-${String(seq).padStart(4, '0')}`
}

function addAudit({ prId = null, poId = null, actionType, userEmail, oldValue, newValue }) {
    const store = readStore()
    const log = {
        id: uid(),
        prId,
        poId,
        actionType,
        userEmail: userEmail || null,
        oldValue: oldValue ?? null,
        newValue: newValue ?? null,
        timestamp: nowIso(),
    }
    store.auditLogs.unshift(log)
    writeStore(store)
    return log
}

export function listRequests({ userEmail } = {}) {
    const store = readStore()
    if (!userEmail) return store.requests
    return store.requests.filter((r) => r.requesterEmail === userEmail)
}

export function getRequestById(id) {
    return readStore().requests.find((r) => r.id === id) || null
}

export function createRequest({ requesterEmail, purpose, urgency, items }) {
    const store = readStore()

    const seq = store.nextRequestSeq
    store.nextRequestSeq += 1

    const id = uid()
    const prNumber = makePrNumber(seq)

    const normalizedItems = (items || []).map((it) => ({
        id: uid(),
        name: it.name?.trim() || '',
        quantity: Number(it.quantity || 0),
        unit: it.unit?.trim() || '',
        unitPrice: Number(it.unitPrice || 0),
    }))

    const totalAmount = normalizedItems.reduce(
        (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
        0,
    )

    const request = {
        id,
        prNumber,
        requesterEmail,
        purpose,
        urgency,
        items: normalizedItems,
        status: 'Pending Approval',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        adminRemarks: null,
        approvedAt: null,
        rejectedAt: null,
        archived: false,
        deleted: false,
        totalAmount,
    }

    store.requests.unshift(request)
    writeStore(store)

    addAudit({
        prId: id,
        actionType: 'Created',
        userEmail: requesterEmail,
        oldValue: null,
        newValue: `Created ${prNumber} (${urgency})`,
    })

    addAudit({
        prId: id,
        actionType: 'Updated',
        userEmail: 'system',
        oldValue: 'Draft',
        newValue: 'System Auto-Validation → Pending Approval',
    })

    return request
}

export function updateRequestStatus({ id, status, adminRemarks, actorEmail }) {
    const store = readStore()
    const idx = store.requests.findIndex((r) => r.id === id)
    if (idx === -1) return null

    const old = store.requests[idx]
    const updated = {
        ...old,
        status,
        adminRemarks: adminRemarks ?? old.adminRemarks,
        approvedAt: status === 'Approved' ? nowIso() : old.approvedAt,
        rejectedAt: status === 'Rejected' ? nowIso() : old.rejectedAt,
        updatedAt: nowIso(),
    }
    store.requests[idx] = updated
    writeStore(store)

    addAudit({
        prId: id,
        actionType: status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Updated',
        userEmail: actorEmail,
        oldValue: old.status,
        newValue: status,
    })

    return updated
}

export function listPurchaseOrders({ userEmail } = {}) {
    const store = readStore()
    if (!userEmail) return store.purchaseOrders
    const myRequests = new Set(store.requests.filter((r) => r.requesterEmail === userEmail).map((r) => r.id))
    return store.purchaseOrders.filter((po) => myRequests.has(po.prId))
}

export function createPurchaseOrder({ prId, actorEmail, supplierName, expectedDeliveryDate, amount }) {
    const store = readStore()
    const requestIdx = store.requests.findIndex((r) => r.id === prId)
    if (requestIdx === -1) return { ok: false, error: 'Request not found' }

    const request = store.requests[requestIdx]
    if (request.status !== 'Approved') {
        return { ok: false, error: 'Request must be Approved first' }
    }

    const existing = store.purchaseOrders.find((po) => po.prId === prId && !po.deleted)
    if (existing) return { ok: false, error: 'Purchase order already exists for this request' }

    const seq = store.nextPoSeq
    store.nextPoSeq += 1

    const po = {
        id: uid(),
        prId,
        poNumber: makePoNumber(seq),
        supplierName: supplierName?.trim() || 'Supplier',
        issueDate: nowIso(),
        expectedDeliveryDate: expectedDeliveryDate || null,
        amount: Number(amount || request.totalAmount || 0),
        status: 'Issued',
        archived: false,
        deleted: false,
    }

    store.purchaseOrders.unshift(po)

    store.requests[requestIdx] = {
        ...request,
        status: 'Processing',
        updatedAt: nowIso(),
    }

    writeStore(store)

    addAudit({
        prId,
        poId: po.id,
        actionType: 'Created',
        userEmail: actorEmail,
        oldValue: null,
        newValue: `Created ${po.poNumber}`,
    })

    return { ok: true, purchaseOrder: po }
}

export function listAuditLogs({ userEmail } = {}) {
    const store = readStore()
    if (!userEmail) return store.auditLogs
    return store.auditLogs.filter((l) => l.userEmail === userEmail)
}

export function archiveRequest({ id, actorEmail }) {
    const store = readStore()
    const idx = store.requests.findIndex((r) => r.id === id)
    if (idx === -1) return null
    const old = store.requests[idx]
    store.requests[idx] = { ...old, archived: true, updatedAt: nowIso() }
    writeStore(store)
    addAudit({ prId: id, actionType: 'Updated', userEmail: actorEmail, oldValue: 'archived=false', newValue: 'archived=true' })
    return store.requests[idx]
}

export function deleteRequest({ id, actorEmail }) {
    const store = readStore()
    const idx = store.requests.findIndex((r) => r.id === id)
    if (idx === -1) return null
    const old = store.requests[idx]
    store.requests[idx] = { ...old, deleted: true, updatedAt: nowIso() }
    writeStore(store)
    addAudit({ prId: id, actionType: 'Updated', userEmail: actorEmail, oldValue: 'deleted=false', newValue: 'deleted=true' })
    return store.requests[idx]
}

export function archivePurchaseOrder({ id, actorEmail }) {
    const store = readStore()
    const idx = store.purchaseOrders.findIndex((p) => p.id === id)
    if (idx === -1) return null
    const old = store.purchaseOrders[idx]
    store.purchaseOrders[idx] = { ...old, archived: true }
    writeStore(store)
    addAudit({ poId: id, actionType: 'Updated', userEmail: actorEmail, oldValue: 'archived=false', newValue: 'archived=true' })
    return store.purchaseOrders[idx]
}

export function deletePurchaseOrder({ id, actorEmail }) {
    const store = readStore()
    const idx = store.purchaseOrders.findIndex((p) => p.id === id)
    if (idx === -1) return null
    const old = store.purchaseOrders[idx]
    store.purchaseOrders[idx] = { ...old, deleted: true }
    writeStore(store)
    addAudit({ poId: id, actionType: 'Updated', userEmail: actorEmail, oldValue: 'deleted=false', newValue: 'deleted=true' })
    return store.purchaseOrders[idx]
}
