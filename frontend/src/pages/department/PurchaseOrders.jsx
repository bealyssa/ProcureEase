import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatMoney } from '@/mock/format'
import { apiFetch } from '@/lib/api'

export default function PurchaseOrders() {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let mounted = true
        async function run() {
            try {
                setLoading(true)
                setError(null)
                const data = await apiFetch('/api/purchase-orders')
                if (!mounted) return
                setRows((data || []).filter((p) => !p.deleted))
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>View Purchase Orders</CardTitle>
                <CardDescription>Purchase orders created by Admin for your requests.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
                {error ? <div className="text-sm text-destructive">{error}</div> : null}
                {!loading && !error && rows.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No purchase orders to show.</div>
                ) : (
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left">
                                    <th className="p-3">PO #</th>
                                    <th className="p-3">Supplier</th>
                                    <th className="p-3">Issued</th>
                                    <th className="p-3">Expected Delivery</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((p) => (
                                    <tr key={p.id} className="border-b last:border-b-0">
                                        <td className="p-3 font-medium">{p.poNumber}</td>
                                        <td className="p-3">{p.supplierName}</td>
                                        <td className="p-3">{formatDate(p.issueDate)}</td>
                                        <td className="p-3">{p.expectedDeliveryDate ? formatDate(p.expectedDeliveryDate) : '-'}</td>
                                        <td className="p-3">{formatMoney(p.amount)}</td>
                                        <td className="p-3">{p.status}</td>
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
