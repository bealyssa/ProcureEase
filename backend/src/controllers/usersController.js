const bcrypt = require('bcryptjs')

const { AppDataSource } = require('../config/dataSource')

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase()
}

function isValidRole(value) {
    return value === 'Admin' || value === 'Department User'
}

async function createUser(req, res) {
    try {
        const { user_name, email, role, password, dept_id, is_active } = req.body || {}

        if (!user_name || !email || !role || !password || !dept_id) {
            return res.status(400).json({
                message: 'user_name, email, role, password, dept_id are required',
            })
        }

        if (!isValidRole(role)) {
            return res.status(400).json({ message: 'Invalid role' })
        }

        const userRepo = AppDataSource.getRepository('User')
        const deptRepo = AppDataSource.getRepository('Department')

        const dept = await deptRepo.findOne({ where: { dept_id: Number(dept_id) } })
        if (!dept) return res.status(400).json({ message: 'Department not found' })

        const emailNorm = normalizeEmail(email)
        const existing = await userRepo.findOne({ where: { email: emailNorm } })
        if (existing) return res.status(409).json({ message: 'Email already exists' })

        const password_hash = await bcrypt.hash(String(password), 10)

        const created = await userRepo.save({
            user_name: String(user_name).trim(),
            email: emailNorm,
            role,
            password_hash,
            is_active: typeof is_active === 'boolean' ? is_active : true,
            department: dept,
        })

        return res.status(201).json({
            user: {
                id: created.user_id,
                name: created.user_name,
                email: created.email,
                role: created.role,
                isActive: created.is_active,
                deptId: dept.dept_id,
                deptName: dept.dept_name,
            },
        })
    } catch {
        return res.status(500).json({ message: 'Failed to create user' })
    }
}

module.exports = {
    createUser,
}
