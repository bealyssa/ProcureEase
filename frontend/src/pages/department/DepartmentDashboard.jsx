import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetch } from '@/lib/api'

export default function DepartmentDashboard() {
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
                const [r, p] = await Promise.all([
                    apiFetch('/api/purchase-requests'),
                    apiFetch('/api/purchase-orders'),
                ])
                if (!mounted) return
                setRequests((r || []).filter((x) => !x.deleted))
                setPos((p || []).filter((x) => !x.deleted))
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

    const pending = useMemo(() => requests.filter((r) => r.status === 'Pending Approval').length, [requests])
    const approved = useMemo(() => requests.filter((r) => r.status === 'Approved').length, [requests])
    const processing = useMemo(() => requests.filter((r) => r.status === 'Processing').length, [requests])

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Department Dashboard</CardTitle>
                    <CardDescription>
                        Quick access to creating requests and tracking progress.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="rounded-md border p-3">
                            <div className="text-muted-foreground">My Requests</div>
                            <div className="text-2xl font-semibold">{requests.length}</div>
                        </div>
                        <div className="rounded-md border p-3">
                            <div className="text-muted-foreground">Pending Approval</div>
                            <div className="text-2xl font-semibold">{pending}</div>
                        </div>
                        <div className="rounded-md border p-3">
                            <div className="text-muted-foreground">Approved</div>
                            <div className="text-2xl font-semibold">{approved}</div>
                        </div>
                        <div className="rounded-md border p-3">
                            <div className="text-muted-foreground">Processing</div>
                            <div className="text-2xl font-semibold">{processing}</div>
                        </div>
                    </div>

                    {loading ? <div className="text-muted-foreground">Loading…</div> : null}
                    {error ? <div className="text-destructive">{error}</div> : null}
                    {!loading && !error ? (
                        <div className="text-muted-foreground">
                            Purchase orders created by Admin will appear under “View Purchase Orders” ({pos.length}).
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}
