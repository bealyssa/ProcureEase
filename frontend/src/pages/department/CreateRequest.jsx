import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatMoney } from '@/mock/format'
import { apiFetch } from '@/lib/api'

function emptyItem() {
    return { name: '', quantity: 1, unit: '', unitPrice: 0 }
}

export default function CreateRequest() {
    const navigate = useNavigate()

    const [purpose, setPurpose] = useState('')
    const [urgency, setUrgency] = useState('Low')
    const [items, setItems] = useState([emptyItem()])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)

    const total = useMemo(() => {
        return items.reduce(
            (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
            0,
        )
    }, [items])

    const canSubmit = useMemo(() => {
        if (!purpose.trim()) return false
        if (!items.length) return false
        const hasValidItem = items.some((it) => it.name.trim() && Number(it.quantity) > 0)
        return hasValidItem
    }, [purpose, items])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Request</CardTitle>
                <CardDescription>
                    Fill out request details and items. On submit, the system runs auto-validation
                    and sends it to Admin for review.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    className="grid gap-6"
                    onSubmit={async (e) => {
                        e.preventDefault()
                        if (!canSubmit || submitting) return

                        try {
                            setSubmitting(true)
                            setError(null)
                            await apiFetch('/api/purchase-requests', {
                                method: 'POST',
                                body: {
                                    purpose: purpose.trim(),
                                    urgency,
                                    items,
                                },
                            })
                            navigate('/department/requests')
                        } catch (err) {
                            setError(err?.message || 'Failed to submit request')
                        } finally {
                            setSubmitting(false)
                        }
                    }}
                >
                    {error ? <div className="text-sm text-destructive">{error}</div> : null}
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Purpose / Description</label>
                        <Input
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="e.g., Medicines for Ward A"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Urgency</label>
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={urgency}
                            onChange={(e) => setUrgency(e.target.value)}
                        >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Urgent</option>
                        </select>
                    </div>

                    <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">Items</div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                            >
                                Add Item
                            </Button>
                        </div>

                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left">
                                        <th className="p-3">Item Name</th>
                                        <th className="p-3">Qty</th>
                                        <th className="p-3">Unit</th>
                                        <th className="p-3">Unit Price</th>
                                        <th className="p-3">Total</th>
                                        <th className="p-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((it, idx) => {
                                        const rowTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                                        return (
                                            <tr key={idx} className="border-b last:border-b-0">
                                                <td className="p-3">
                                                    <Input
                                                        value={it.name}
                                                        onChange={(e) => {
                                                            const v = e.target.value
                                                            setItems((prev) =>
                                                                prev.map((x, i) => (i === idx ? { ...x, name: v } : x)),
                                                            )
                                                        }}
                                                        placeholder="e.g., Syringes"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={it.quantity}
                                                        onChange={(e) => {
                                                            const v = e.target.value
                                                            setItems((prev) =>
                                                                prev.map((x, i) =>
                                                                    i === idx ? { ...x, quantity: Number(v) } : x,
                                                                ),
                                                            )
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <Input
                                                        value={it.unit}
                                                        onChange={(e) => {
                                                            const v = e.target.value
                                                            setItems((prev) =>
                                                                prev.map((x, i) => (i === idx ? { ...x, unit: v } : x)),
                                                            )
                                                        }}
                                                        placeholder="pcs, box, vial"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={it.unitPrice}
                                                        onChange={(e) => {
                                                            const v = e.target.value
                                                            setItems((prev) =>
                                                                prev.map((x, i) =>
                                                                    i === idx ? { ...x, unitPrice: Number(v) } : x,
                                                                ),
                                                            )
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-3 font-medium">{formatMoney(rowTotal)}</td>
                                                <td className="p-3">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setItems((prev) => prev.filter((_, i) => i !== idx))
                                                        }}
                                                        disabled={items.length === 1}
                                                    >
                                                        Remove
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-end gap-2 text-sm">
                            <span className="text-muted-foreground">Total Amount:</span>
                            <span className="font-semibold">{formatMoney(total)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="submit" disabled={!canSubmit || submitting}>
                            {submitting ? 'Submitting…' : 'Submit Request'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => navigate('/department/requests')}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
