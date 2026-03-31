const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { AppDataSource } = require('../config/dataSource')
const { JWT_SECRET } = require('../middleware/auth')

function toUserResponse(u) {
    return {
        id: u.user_id,
        name: u.user_name,
        email: u.email,
        role: u.role,
        isActive: u.is_active,
        deptId: u.department?.dept_id ?? null,
        deptName: u.department?.dept_name ?? null,
    }
}

async function login(req, res) {
    const { email, password, role } = req.body || {}

    if (!email || !password) {
        return res.status(400).json({ message: 'email and password are required' })
    }

    const userRepo = AppDataSource.getRepository('User')

    const user = await userRepo.findOne({
        where: { email: String(email).trim().toLowerCase() },
        relations: ['department'],
    })

    if (!user || !user.is_active) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (role && String(role) !== user.role) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const ok = await bcrypt.compare(String(password), user.password_hash)
    if (!ok) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
        { sub: String(user.user_id), email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '8h' },
    )

    return res.json({ token, user: toUserResponse(user) })
}

async function me(req, res) {
    const userRepo = AppDataSource.getRepository('User')
    const user = await userRepo.findOne({
        where: { user_id: Number(req.auth.userId) },
        relations: ['department'],
    })

    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.json({ user: toUserResponse(user) })
}

module.exports = {
    login,
    me,
}
