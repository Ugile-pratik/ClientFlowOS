const invoiceService = require('../services/invoice.service');

const createInvoice = async (req, res) => {
  const userId = req.user.id;
  try {
    const invoice = await invoiceService.createInvoice(userId, req.body);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create Invoice Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const getInvoices = async (req, res) => {
  const userId = req.user.id;
  const { status, projectId, clientId, q } = req.query;
  try {
    const invoices = await invoiceService.getInvoices(userId, { status, projectId, clientId, q });
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Get Invoices Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const getInvoiceById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const invoice = await invoiceService.getInvoiceById(userId, id);
    res.status(200).json(invoice);
  } catch (error) {
    console.error('Get Invoice by ID Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const updateInvoice = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const invoice = await invoiceService.updateInvoice(userId, id, req.body);
    res.status(200).json(invoice);
  } catch (error) {
    console.error('Update Invoice Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const deleteInvoice = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await invoiceService.deleteInvoice(userId, id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Delete Invoice Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const recordPayment = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const updatedInvoice = await invoiceService.recordPayment(userId, id, req.body);
    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Record Payment Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  recordPayment,
};
