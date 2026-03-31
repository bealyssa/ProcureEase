import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatMoney } from '@/mock/format'
import { apiFetch } from '@/lib/api'

function statusVariant(status) {
    if (status === 'Approved') return 'default'
    if (status === 'Rejected') return 'outline'
    return 'secondary'
}

function getRowTotalAmount(r) {
    const direct = Number(r?.totalAmount ?? r?.total_amount)
    if (Number.isFinite(direct)) return direct

    const items = Array.isArray(r?.items) ? r.items : []
    return items.reduce((sum, it) => {
        const qty = Number(it?.quantity || 0)
        const unitPrice = Number(it?.unitPrice ?? it?.unit_price ?? 0)
        return sum + (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0)
    }, 0)
}

export default function MyRequests() {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let mounted = true
        async function run() {
            try {
                setLoading(true)
                setError(null)
                const data = await apiFetch('/api/purchase-requests')
                if (!mounted) return
                setRows((data || []).filter((r) => !r?.deleted))
            } catch (e) {
                if (!mounted) return
                setError(e?.message || 'Failed to load requests')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        run()
        return () => {
            mounted = false
        }
    }, [])

    const hasRows = useMemo(() => rows.length > 0, [rows])

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <CardTitle>View My Requests</CardTitle>
                        <CardDescription>Track request status and view details.</CardDescription>
                    </div>
                    <Button asChild>
                        <Link to="/department/create">Create New Request</Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
                {error ? <div className="text-sm text-destructive">{error}</div> : null}
                {!loading && !error && !hasRows ? (
                    <div className="text-sm text-muted-foreground">No requests to show.</div>
                ) : null}
                {!loading && !error && hasRows ? (
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left">
                                    <th className="p-3">PR #</th>
                                    <th className="p-3">Created</th>
                                    <th className="p-3">Urgency</th>
                                    <th className="p-3">Total</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.id} className="border-b last:border-b-0">
                                        <td className="p-3 font-medium">{r.prNumber}</td>
                                        <td className="p-3">{formatDate(r.createdAt || r.created_at)}</td>
                                        <td className="p-3">{r.urgency || r.priority_level || 'Low'}</td>
                                        <td className="p-3">{formatMoney(getRowTotalAmount(r))}</td>
                                        <td className="p-3">
                                            <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                                        </td>
                                        <td className="p-3">
                                            <Button asChild size="sm" variant="outline">
                                                <Link to={`/department/requests/${r.id}`}>View</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    )
}
