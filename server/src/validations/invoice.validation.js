const validateInvoice = (req, res, next) => {
  const { projectId, amount, dueDate, status, items, taxRate, discount, amountPaid } = req.body;

  // Project ID check
  const parsedProjectId = parseInt(projectId, 10);
  if (!projectId || isNaN(parsedProjectId)) {
    return res.status(400).json({ error: 'A valid Project must be selected.' });
  }

  // Due Date check
  if (!dueDate || isNaN(Date.parse(dueDate))) {
    return res.status(400).json({ error: 'A valid Due Date is required.' });
  }

  // Amount check if provided
  if (amount !== undefined && amount !== null && amount !== '') {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invoice Amount must be greater than zero.' });
    }
  }

  // Optional Amount Paid check
  if (amountPaid !== undefined && amountPaid !== null && amountPaid !== '') {
    const parsedPaid = parseFloat(amountPaid);
    if (isNaN(parsedPaid) || parsedPaid < 0) {
      return res.status(400).json({ error: 'Amount Paid must be a non-negative number.' });
    }
  }

  // Items validation if provided
  if (items && !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invoice items must be an array of line items.' });
  }

  // Status check
  const validStatuses = ['Draft', 'Sent', 'Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}.` });
  }

  next();
};

const validatePayment = (req, res, next) => {
  const { amountPaid, paymentMethod } = req.body;

  // Amount paid check
  const parsedAmountPaid = parseFloat(amountPaid);
  if (amountPaid === undefined || amountPaid === null || isNaN(parsedAmountPaid) || parsedAmountPaid <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
  }

  // Payment method check
  const validMethods = ['Bank Transfer', 'UPI', 'Credit Card', 'Cash', 'Cheque', 'Other'];
  if (!paymentMethod || !validMethods.includes(paymentMethod)) {
    return res.status(400).json({ error: `Payment Method must be one of: ${validMethods.join(', ')}.` });
  }

  next();
};

module.exports = {
  validateInvoice,
  validatePayment,
};
