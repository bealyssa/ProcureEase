import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatMoney } from '@/mock/format'
import { apiFetch } from '@/lib/api'
import ConfirmActionDialog from '@/components/ConfirmActionDialog'

export default function CreatePurchaseOrder() {
    const { prId } = useParams()
    const navigate = useNavigate()

    const [request, setRequest] = useState(null)
    const [existingPo, setExistingPo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const requestId = useMemo(() => Number(prId), [prId])

    useEffect(() => {
        let mounted = true
        async function run() {
            if (!Number.isFinite(requestId)) {
                setError('Invalid request id')
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError('')
                const [pr, pos] = await Promise.all([
                    apiFetch(`/api/purchase-requests/${requestId}`),
                    apiFetch('/api/purchase-orders'),
                ])
                if (!mounted) return

                setRequest(pr)
                const linked = (pos || []).find((p) => Number(p?.prId) === requestId && !p?.deleted) || null
                setExistingPo(linked)
            } catch (e) {
                if (!mounted) return
                setError(e?.message || 'Failed to load request')
                setRequest(null)
                setExistingPo(null)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        run()
        return () => {
            mounted = false
        }
    }, [requestId])

    const [supplierName, setSupplierName] = useState('')
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
    const [amount, setAmount] = useState('')
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

    if (!request || request.deleted) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Request not found</CardTitle>
                    <CardDescription>Cannot create a PO because the request does not exist.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link to="/admin/purchase-orders">Back</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (existingPo) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Purchase order already exists</CardTitle>
                    <CardDescription>
                        {existingPo.poNumber} is already linked to {request.prNumber}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link to={`/admin/requests/${request.id}`}>View Request</Link>
                    </Button>
                    <Button asChild>
                        <Link to="/admin/purchase-orders">Back</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const canCreate = request.status === 'Approved' && !request.archived

    async function createPo() {
        setError('')

        if (!canCreate) {
            const err = new Error('Request must be Approved (and not archived) to create a PO.')
            setError(err.message)
            throw err
        }

        if (submitting) return

        try {
            setSubmitting(true)
            await apiFetch('/api/purchase-orders', {
                method: 'POST',
                body: {
                    prId: request.id,
                    supplierName: supplierName.trim() || 'Supplier',
                    expectedDeliveryDate: expectedDeliveryDate || null,
                    amount: amount ? Number(amount) : request.totalAmount,
                },
            })

            navigate('/admin/purchase-orders')
            return true
        } catch (err) {
            setError(err?.message || 'Failed to create purchase order')
            throw err
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Purchase Order</CardTitle>
                <CardDescription>
                    For {request.prNumber} • Total {formatMoney(request.totalAmount)}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                {error ? (
                    <div className="rounded-md border p-3 text-sm">
                        <div className="font-medium">Cannot proceed</div>
                        <div className="text-muted-foreground">{error}</div>
                    </div>
                ) : null}

                <form className="grid gap-3" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid gap-2">
                        <div className="text-sm font-medium">Supplier Name</div>
                        <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Supplier" />
                    </div>

                    <div className="grid gap-2">
                        <div className="text-sm font-medium">Expected Delivery Date</div>
                        <Input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <div className="text-sm font-medium">PO Amount</div>
                        <Input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={String(request.totalAmount || 0)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                        <ConfirmActionDialog
                            title="Create this purchase order?"
                            description="This will create a purchase order and link it to the approved request."
                            confirmText="Create"
                            successMessage="Purchase order created."
                            onConfirm={createPo}
                        >
                            <Button type="button" disabled={submitting}>
                                {submitting ? 'Creating…' : 'Create PO'}
                            </Button>
                        </ConfirmActionDialog>
                        <Button asChild type="button" variant="outline">
                            <Link to={`/admin/requests/${request.id}`}>Back to Request</Link>
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
