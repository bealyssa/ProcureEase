const { AppDataSource } = require('../config/dataSource')

async function listDepartments(req, res) {
    try {
        const repo = AppDataSource.getRepository('Department')
        const rows = await repo.find({ order: { dept_id: 'ASC' } })
        return res.json({
            departments: rows.map((d) => ({
                dept_id: d.dept_id,
                dept_name: d.dept_name,
            })),
        })
    } catch {
        return res.status(500).json({ message: 'Failed to list departments' })
    }
}

async function createDepartment(req, res) {
    try {
        const { dept_name, dept_head_name, contact_number, budget_allocation } = req.body || {}
        if (!dept_name) return res.status(400).json({ message: 'dept_name is required' })

        const repo = AppDataSource.getRepository('Department')
        const created = await repo.save({
            dept_name: String(dept_name).trim(),
            dept_head_name: dept_head_name ?? null,
            contact_number: contact_number ?? null,
            budget_allocation: budget_allocation ?? null,
        })

        return res.status(201).json({
            department: {
                dept_id: created.dept_id,
                dept_name: created.dept_name,
            },
        })
    } catch {
        return res.status(500).json({ message: 'Failed to create department' })
    }
}

module.exports = {
    listDepartments,
    createDepartment,
}
