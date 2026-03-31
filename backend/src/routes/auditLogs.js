const express = require('express')
const { requireAuth } = require('../middleware/auth')
const auditLogsController = require('../controllers/auditLogsController')

const router = express.Router()

router.get('/', requireAuth, auditLogsController.listAuditLogs)

module.exports = router
