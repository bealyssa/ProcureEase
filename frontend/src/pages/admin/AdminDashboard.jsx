import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetch } from '@/lib/api'

export default function AdminDashboard() {
    const [requests, setRequests] = useState([])
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
                setRequests((prs || []).filter((r) => !r?.deleted))
                setPos((purchaseOrders || []).filter((p) => !p?.deleted))
            } catch (e) {
                if (!mounted) return
                setError(e?.message || 'Failed to load dashboard')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        run()
        return () => {
            mounted = false
        }
    }, [])

    const pending = requests.filter((r) => r.status === 'Pending Approval' && !r.archived).length
    const approvedNoPo = requests.filter((r) => r.status === 'Approved' && !r.archived && !pos.some((p) => p.prId === r.id)).length
    const archived = requests.filter((r) => r.archived).length

    const summary = useMemo(() => {
        if (loading) return 'Loading…'
        if (error) return error
        return `Archived requests: ${archived}.`
    }, [loading, error, archived])

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Admin Dashboard</CardTitle>
                    <CardDescription>
                        Review requests, manage purchase orders, and maintain records.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm">
                    {error ? <div className="text-sm text-destructive">{error}</div> : null}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="rounded-md border p-3">
                            <div className="text-muted-foreground">Total Requests</div>
                            <div className="text-2xl font-semibold">{requests.length}</div>
                        </div>
                        <div className="rounded-md border p-3">
                            <div className="text-muted-foreground">Pending Approvals</div>
                            <div className="text-2xl font-semibold">{pending}</div>
                        </div>
                        <div className="rounded-md border p-3">
                            <div className="text-muted-foreground">Approved (No PO)</div>
                            <div className="text-2xl font-semibold">{approvedNoPo}</div>
                        </div>
                        <div className="rounded-md border p-3">
                            <div className="text-muted-foreground">Purchase Orders</div>
                            <div className="text-2xl font-semibold">{pos.length}</div>
                        </div>
                    </div>

                    <div className="text-muted-foreground">
                        {summary}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
