import { authHeaders } from '@/auth/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export async function apiFetch(path, { method = 'GET', headers, body } = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
            ...authHeaders(),
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(headers || {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
        const message = data?.message || `Request failed (${res.status})`
        const error = new Error(message)
        error.status = res.status
        error.data = data
        throw error
    }
    return data
}
