import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/mock/format'
import { apiFetch } from '@/lib/api'

export default function TransactionHistory() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let mounted = true
        async function run() {
            try {
                setLoading(true)
                setError(null)
                const data = await apiFetch('/api/audit-logs?limit=100')
                if (!mounted) return
                setLogs(data || [])
            } catch (e) {
                if (!mounted) return
                setError(e?.message || 'Failed to load history')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        run()
        return () => {
            mounted = false
        }
    }, [])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your actions in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
                {error ? <div className="text-sm text-destructive">{error}</div> : null}
                {!loading && !error && logs.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No history yet.</div>
                ) : (
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left">
                                    <th className="p-3">Time</th>
                                    <th className="p-3">Action</th>
                                    <th className="p-3">Old</th>
                                    <th className="p-3">New</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((l) => (
                                    <tr key={l.id} className="border-b last:border-b-0">
                                        <td className="p-3">{formatDate(l.timestamp)}</td>
                                        <td className="p-3 font-medium">{l.actionType}</td>
                                        <td className="p-3 text-muted-foreground">{l.oldValue ?? '-'}</td>
                                        <td className="p-3">{l.newValue ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
