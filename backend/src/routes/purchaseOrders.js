const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const purchaseOrdersController = require('../controllers/purchaseOrdersController')

const router = express.Router()

router.get('/', requireAuth, purchaseOrdersController.listPurchaseOrders)
router.get('/:id', requireAuth, purchaseOrdersController.getPurchaseOrder)
router.post('/', requireAuth, requireRole('Admin'), purchaseOrdersController.createPurchaseOrder)
router.patch('/:id/flags', requireAuth, requireRole('Admin'), purchaseOrdersController.updatePurchaseOrderFlags)

module.exports = router
