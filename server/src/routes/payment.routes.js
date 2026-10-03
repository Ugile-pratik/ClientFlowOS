const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', paymentController.recordPayment);
router.post('/invoice/:invoiceId', paymentController.recordPayment);
router.get('/', paymentController.getPayments);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
