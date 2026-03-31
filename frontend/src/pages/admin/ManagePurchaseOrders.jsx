import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatMoney } from '@/mock/format'
import { apiFetch } from '@/lib/api'

function poVariant(status) {
    if (status === 'Issued') return 'default'
    return 'secondary'
}

export default function ManagePurchaseOrders() {
    const [allRequests, setAllRequests] = useState([])
    const [pos, setPos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let mounted = true
        async function run() {
            try {
                setLoading(true)
                setError(null)
                const [prs, purchaseOrders] = await Promise.all([
                    apiFetch('/api/purchase-requests'),
                    apiFetch('/api/purchase-orders'),
                ])
                if (!mounted) return
                setAllRequests((prs || []).filter((r) => !r?.deleted))
                setPos((purchaseOrders || []).filter((p) => !p?.deleted))
            } catch (e) {
                if (!mounted) return
                setError(e?.message || 'Failed to load purchase orders')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        run()
        return () => {
            mounted = false
        }
    }, [])

    const activeRequests = useMemo(() => allRequests.filter((r) => !r.archived), [allRequests])
    const poByPrId = useMemo(() => new Map(pos.map((p) => [Number(p.prId), p])), [pos])
    const requestById = useMemo(() => new Map(allRequests.map((r) => [Number(r.id), r])), [allRequests])

    const readyForPo = useMemo(
        () => activeRequests.filter((r) => r.status === 'Approved' && !poByPrId.has(Number(r.id))),
        [activeRequests, poByPrId],
    )

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Approved Requests (No PO Yet)</CardTitle>
                    <CardDescription>Create purchase orders for approved requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
                    {error ? <div className="text-sm text-destructive">{error}</div> : null}
                    {!loading && !error && readyForPo.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No approved requests waiting for a PO.</div>
                    ) : null}
                    {!loading && !error && readyForPo.length > 0 ? (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left">
                                        <th className="p-3">PR #</th>
                                        <th className="p-3">Requester</th>
                                        <th className="p-3">Approved</th>
                                        <th className="p-3">Total</th>
                                        <th className="p-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {readyForPo.map((r) => (
                                        <tr key={r.id} className="border-b last:border-b-0">
                                            <td className="p-3 font-medium">{r.prNumber}</td>
                                            <td className="p-3">{r.requesterEmail}</td>
                                            <td className="p-3">{r.approvedAt ? formatDate(r.approvedAt) : '-'}</td>
                                            <td className="p-3">{formatMoney(r.totalAmount)}</td>
                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <Button asChild size="sm">
                                                        <Link to={`/admin/purchase-orders/create/${r.id}`}>Create PO</Link>
                                                    </Button>
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link to={`/admin/requests/${r.id}`}>View Request</Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All Purchase Orders</CardTitle>
                    <CardDescription>Issued purchase orders across all departments.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
                    {error ? <div className="text-sm text-destructive">{error}</div> : null}
                    {!loading && !error && pos.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No purchase orders yet.</div>
                    ) : null}
                    {!loading && !error && pos.length > 0 ? (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left">
                                        <th className="p-3">PO #</th>
                                        <th className="p-3">PR #</th>
                                        <th className="p-3">Supplier</th>
                                        <th className="p-3">Issued</th>
                                        <th className="p-3">Amount</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pos.map((po) => {
                                        const prNumber = requestById.get(Number(po.prId))?.prNumber || po.prId

                                        return (
                                            <tr key={po.id} className="border-b last:border-b-0">
                                                <td className="p-3 font-medium">{po.poNumber}</td>
                                                <td className="p-3">{prNumber}</td>
                                                <td className="p-3">{po.supplierName}</td>
                                                <td className="p-3">{formatDate(po.issueDate)}</td>
                                                <td className="p-3">{formatMoney(po.amount)}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge variant={poVariant(po.status)}>{po.status}</Badge>
                                                        {po.archived ? <Badge variant="outline">Archived</Badge> : null}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link to={`/admin/requests/${po.prId}`}>View Request</Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}
