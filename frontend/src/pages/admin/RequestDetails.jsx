import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatMoney } from '@/mock/format'
import { apiFetch } from '@/lib/api'
import ConfirmActionDialog from '@/components/ConfirmActionDialog'

function statusVariant(status) {
    if (status === 'Approved') return 'default'
    if (status === 'Rejected') return 'outline'
    if (status === 'Processing') return 'secondary'
    return 'secondary'
}

export default function AdminRequestDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [remarks, setRemarks] = useState('')
    const [request, setRequest] = useState(null)
    const [po, setPo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [actionError, setActionError] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const requestId = useMemo(() => Number(id), [id])

    async function load() {
        if (!Number.isFinite(requestId)) {
            setLoadError('Invalid request id')
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setLoadError(null)

            const [pr, pos] = await Promise.all([
                apiFetch(`/api/purchase-requests/${requestId}`),
                apiFetch('/api/purchase-orders'),
            ])

            setRequest(pr)
            const linked = (pos || []).find((p) => Number(p?.prId) === requestId && !p?.deleted) || null
            setPo(linked)
        } catch (e) {
            setLoadError(e?.message || 'Failed to load request')
            setRequest(null)
            setPo(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [requestId])

    const items = Array.isArray(request?.items) ? request.items : []
    const totalAmount = useMemo(() => {
        const direct = Number(request?.totalAmount)
        if (Number.isFinite(direct)) return direct
        return items.reduce((sum, it) => {
            const qty = Number(it?.quantity || 0)
            const unitPrice = Number(it?.unitPrice || 0)
            return sum + (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0)
        }, 0)
    }, [request?.totalAmount, items])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Loading…</CardTitle>
                    <CardDescription>Fetching request details.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    if (loadError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Request error</CardTitle>
                    <CardDescription>{loadError}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link to="/admin/requests">Back</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (!request || request.deleted) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Request not found</CardTitle>
                    <CardDescription>This request does not exist.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link to="/admin/requests">Back</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    async function handleReview(nextStatus) {
        if (submitting) return

        const nextRemarks = remarks.trim()
        const adminRemarks = nextRemarks ? nextRemarks : nextStatus === 'Rejected' ? 'Rejected by Admin' : null

        try {
            setSubmitting(true)
            setActionError(null)
            await apiFetch(`/api/purchase-requests/${requestId}/status`, {
                method: 'PATCH',
                body: {
                    status: nextStatus,
                    adminRemarks,
                },
            })
            setRemarks('')
            await load()
        } catch (e) {
            setActionError(e?.message || 'Failed to update request')
            throw e
        } finally {
            setSubmitting(false)
        }
    }

    const canReview = request.status === 'Pending Approval' && !request.archived
    const canCreatePo = request.status === 'Approved' && !request.archived && !po

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <CardTitle>{request.prNumber}</CardTitle>
                            <CardDescription>
                                {request.purpose} • Requested by {request.requesterEmail}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                            {request.archived ? <Badge variant="outline">Archived</Badge> : null}
                            <Button asChild variant="outline">
                                <Link to="/admin/requests">Back</Link>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {actionError ? <div className="text-sm text-destructive">{actionError}</div> : null}
                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
                        <div>
                            <div className="text-muted-foreground">Urgency</div>
                            <div className="font-medium">{request.urgency || request.priority_level || 'Low'}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Created</div>
                            <div className="font-medium">{formatDate(request.createdAt || request.created_at)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Updated</div>
                            <div className="font-medium">{formatDate(request.updatedAt || request.updated_at)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Total</div>
                            <div className="font-medium">{formatMoney(totalAmount)}</div>
                        </div>
                    </div>

                    {request.status === 'Rejected' && request.adminRemarks ? (
                        <div className="rounded-md border p-3 text-sm">
                            <div className="font-medium">Admin remarks</div>
                            <div className="text-muted-foreground">{request.adminRemarks}</div>
                        </div>
                    ) : null}

                    <div className="grid gap-2">
                        <div className="text-sm font-medium">Items</div>
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left">
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Qty</th>
                                        <th className="p-3">Unit</th>
                                        <th className="p-3">Unit Price</th>
                                        <th className="p-3">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((it) => (
                                        <tr key={it.id} className="border-b last:border-b-0">
                                            <td className="p-3">{it.name}</td>
                                            <td className="p-3">{it.quantity}</td>
                                            <td className="p-3">{it.unit || '-'}</td>
                                            <td className="p-3">{formatMoney(it.unitPrice)}</td>
                                            <td className="p-3 font-medium">
                                                {formatMoney((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {po ? (
                        <div className="rounded-md border p-3 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <div className="font-medium">Purchase Order</div>
                                    <div className="text-muted-foreground">
                                        {po.poNumber} • {po.supplierName} • {po.status}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-muted-foreground">Amount</div>
                                    <div className="font-medium">{formatMoney(po.amount)}</div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {canReview ? (
                        <div className="grid gap-3 rounded-md border p-3">
                            <div className="text-sm font-medium">Admin review</div>
                            <Textarea
                                placeholder="Remarks (optional)"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                            <div className="flex flex-wrap gap-2">
                                <ConfirmActionDialog
                                    title="Approve this request?"
                                    description="This will mark the request as Approved."
                                    confirmText="Approve"
                                    successMessage="Request approved."
                                    onConfirm={() => handleReview('Approved')}
                                >
                                    <Button type="button" disabled={submitting}>
                                        {submitting ? 'Saving…' : 'Approve'}
                                    </Button>
                                </ConfirmActionDialog>

                                <ConfirmActionDialog
                                    title="Reject this request?"
                                    description="This will mark the request as Rejected."
                                    confirmText="Reject"
                                    confirmVariant="destructive"
                                    successMessage="Request rejected."
                                    onConfirm={() => handleReview('Rejected')}
                                >
                                    <Button type="button" variant="destructive" disabled={submitting}>
                                        {submitting ? 'Saving…' : 'Reject'}
                                    </Button>
                                </ConfirmActionDialog>
                            </div>
                        </div>
                    ) : null}

                    {canCreatePo ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                            <div>
                                <div className="font-medium">Next step</div>
                                <div className="text-muted-foreground">Create a purchase order for this approved request.</div>
                            </div>
                            <Button type="button" onClick={() => navigate(`/admin/purchase-orders/create/${request.id}`)}>
                                Create Purchase Order
                            </Button>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}
