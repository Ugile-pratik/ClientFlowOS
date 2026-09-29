const express = require('express');
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  recordPayment,
} = require('../controllers/invoice.controller');
const { validateInvoice, validatePayment } = require('../validations/invoice.validation');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all invoice routes
router.use(authMiddleware);

// Standard Invoice Routes
router.get('/', getInvoices);
router.post('/', validateInvoice, createInvoice);
router.get('/:id', getInvoiceById);
router.put('/:id', validateInvoice, updateInvoice);
router.delete('/:id', deleteInvoice);

// Payment Recording Route
router.post('/:id/payments', validatePayment, recordPayment);

module.exports = router;
