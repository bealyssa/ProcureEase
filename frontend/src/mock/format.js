export function formatMoney(value) {
    const n = Number(value || 0)
    return n.toLocaleString(undefined, { style: 'currency', currency: 'PHP' })
}

export function formatDate(iso) {
    if (!iso) return '-'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleString()
}
