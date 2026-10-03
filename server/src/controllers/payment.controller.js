const paymentService = require('../services/payment.service');

const recordPayment = async (req, res) => {
  const userId = req.user.id;
  const { invoiceId } = req.body;
  const targetInvoiceId = invoiceId || req.params.invoiceId;

  try {
    const result = await paymentService.recordPayment(userId, targetInvoiceId, req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Record Payment Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to record payment.' });
  }
};

const getPayments = async (req, res) => {
  const userId = req.user.id;
  const { clientId, paymentMethod, q } = req.query;

  try {
    const result = await paymentService.getAllPayments(userId, { clientId, paymentMethod, q });
    res.status(200).json(result);
  } catch (error) {
    console.error('Get Payments Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to fetch payments.' });
  }
};

const deletePayment = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const result = await paymentService.deletePayment(userId, id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Delete Payment Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to delete payment.' });
  }
};

module.exports = {
  recordPayment,
  getPayments,
  deletePayment,
};
