const AUTH_KEY = 'pe_auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export async function signIn({ role, email, password }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email, password }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
        throw new Error(data?.message || 'Login failed')
    }

    const payload = {
        token: data.token,
        role: data.user?.role,
        email: data.user?.email,
        user: data.user || null,
        signedInAt: new Date().toISOString(),
    }

    localStorage.setItem(AUTH_KEY, JSON.stringify(payload))
    return payload
}

export function signOut() {
    localStorage.removeItem(AUTH_KEY)
}

export function getAuth() {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null

    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}

export function isSignedIn() {
    const a = getAuth()
    return Boolean(a?.token && a?.role)
}

export function getRole() {
    return getAuth()?.role || null
}

export function getToken() {
    return getAuth()?.token || null
}

export function authHeaders() {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
}
