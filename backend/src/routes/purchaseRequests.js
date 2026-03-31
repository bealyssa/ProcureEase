const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const purchaseRequestsController = require('../controllers/purchaseRequestsController')

const router = express.Router()

router.get('/', requireAuth, purchaseRequestsController.listPurchaseRequests)
router.get('/:id', requireAuth, purchaseRequestsController.getPurchaseRequest)
router.post('/', requireAuth, purchaseRequestsController.createPurchaseRequest)
router.patch('/:id/status', requireAuth, requireRole('Admin'), purchaseRequestsController.updatePurchaseRequestStatus)
router.patch('/:id/flags', requireAuth, requireRole('Admin'), purchaseRequestsController.updatePurchaseRequestFlags)

module.exports = router
