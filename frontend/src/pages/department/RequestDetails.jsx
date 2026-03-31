import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { formatDate, formatMoney } from '@/mock/format'
import { apiFetch } from '@/lib/api'

function statusVariant(status) {
    if (status === 'Approved') return 'default'
    if (status === 'Rejected') return 'outline'
    return 'secondary'
}

function Timeline({ request }) {
    const steps = [
        { key: 'Created', label: 'Submitted' },
        { key: 'Pending Approval', label: 'Pending Approval' },
        { key: 'Approved', label: 'Approved' },
        { key: 'Processing', label: 'Processing (PO Created)' },
    ]

    const current = request.status

    return (
        <div className="grid gap-2">
            {steps.map((s) => {
                const reached =
                    current === s.key ||
                    (s.key === 'Created' && Boolean(request.createdAt)) ||
                    (s.key === 'Pending Approval' && ['Pending Approval', 'Approved', 'Rejected', 'Processing', 'Completed'].includes(current)) ||
                    (s.key === 'Approved' && ['Approved', 'Processing', 'Completed'].includes(current)) ||
                    (s.key === 'Processing' && ['Processing', 'Completed'].includes(current))

                return (
                    <div key={s.key} className="flex items-center gap-2 text-sm">
                        <div
                            className={
                                'h-2.5 w-2.5 rounded-full ' +
                                (reached ? 'bg-primary' : 'bg-muted')
                            }
                        />
                        <div className={reached ? 'text-foreground' : 'text-muted-foreground'}>
                            {s.label}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default function RequestDetails() {
    const { id } = useParams()
    const [request, setRequest] = useState(null)
    const [myPO, setMyPO] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const numericId = useMemo(() => Number(id), [id])

    useEffect(() => {
        let mounted = true
        async function run() {
            try {
                setLoading(true)
                setError(null)
                if (!Number.isFinite(numericId)) {
                    setRequest(null)
                    return
                }

                const [r, pos] = await Promise.all([
                    apiFetch(`/api/purchase-requests/${numericId}`),
                    apiFetch('/api/purchase-orders'),
                ])

                if (!mounted) return
                setRequest(r)
                const found = (pos || []).filter((p) => !p.deleted).find((p) => p.prId === numericId) || null
                setMyPO(found)
            } catch (e) {
                if (!mounted) return
                setError(e?.message || 'Failed to load request')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        run()
        return () => {
            mounted = false
        }
    }, [numericId])

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

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Failed to load</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link to="/department/requests">Back</Link>
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
                        <Link to="/department/requests">Back</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <CardTitle>{request.prNumber}</CardTitle>
                            <CardDescription>{request.purpose}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                            <Button asChild variant="outline">
                                <Link to="/department/requests">Back</Link>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <div className="text-sm font-medium">Tracking</div>
                        <Timeline request={request} />
                    </div>

                    <div className="grid gap-2 text-sm">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                            <div>
                                <div className="text-muted-foreground">Urgency</div>
                                <div className="font-medium">{request.urgency}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Created</div>
                                <div className="font-medium">{formatDate(request.createdAt)}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Total</div>
                                <div className="font-medium">{formatMoney(request.totalAmount)}</div>
                            </div>
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
                                    {request.items.map((it) => (
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

                    {myPO ? (
                        <div className="rounded-md border p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <div className="font-medium">Purchase Order</div>
                                    <div className="text-muted-foreground">{myPO.poNumber} • {myPO.status}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-muted-foreground">Amount</div>
                                    <div className="font-medium">{formatMoney(myPO.amount)}</div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}
