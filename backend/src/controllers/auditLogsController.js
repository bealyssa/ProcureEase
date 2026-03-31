const { AppDataSource } = require('../config/dataSource')

async function listAuditLogs(req, res) {
    try {
        const limitRaw = req.query.limit
        const limit = Math.min(Math.max(Number(limitRaw || 50) || 50, 1), 200)

        const auditRepo = AppDataSource.getRepository('AuditLog')

        const where = {}
        if (req.auth.role !== 'Admin') {
            where.user = { user_id: req.auth.userId }
        }

        const logs = await auditRepo.find({
            where,
            relations: {
                user: true,
            },
            order: { log_id: 'DESC' },
            take: limit,
        })

        res.json(
            logs.map((l) => ({
                id: l.log_id,
                prId: l.pr_id,
                poId: l.po_id,
                actionType: l.action_type,
                userEmail: l.user?.email || null,
                oldValue: l.old_value,
                newValue: l.new_value,
                timestamp: l.timestamp,
            })),
        )
    } catch {
        res.status(500).json({ message: 'Failed to list audit logs' })
    }
}

module.exports = {
    listAuditLogs,
}
