const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'dev-auth-secret-change-me'

function getTokenFromRequest(req) {
    const raw = req.headers.authorization || ''
    const [type, token] = raw.split(' ')
    if (type !== 'Bearer' || !token) return null
    return token
}

function requireAuth(req, res, next) {
    const token = getTokenFromRequest(req)
    if (!token) return res.status(401).json({ message: 'Missing bearer token' })

    try {
        const payload = jwt.verify(token, JWT_SECRET)
        req.auth = {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
        }
        return next()
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
}

function requireRole(roles) {
    const allow = Array.isArray(roles) ? roles : [roles]
    return (req, res, next) => {
        const role = req.auth?.role
        if (!role || !allow.includes(role)) {
            return res.status(403).json({ message: 'Forbidden' })
        }
        return next()
    }
}

module.exports = {
    JWT_SECRET,
    requireAuth,
    requireRole,
}
