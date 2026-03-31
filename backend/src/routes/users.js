const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const usersController = require('../controllers/usersController')

const router = express.Router()

router.post('/', requireAuth, requireRole('Admin'), usersController.createUser)

module.exports = router
