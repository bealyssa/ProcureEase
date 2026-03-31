const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const departmentsController = require('../controllers/departmentsController')

const router = express.Router()

router.get('/', requireAuth, requireRole('Admin'), departmentsController.listDepartments)
router.post('/', requireAuth, requireRole('Admin'), departmentsController.createDepartment)

module.exports = router
