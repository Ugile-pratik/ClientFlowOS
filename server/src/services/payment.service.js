const prisma = require('../config/db');

/**
 * Record a payment against an invoice and auto-calculate invoice status
 */
const recordPayment = async (userId, invoiceId, paymentData) => {
  const id = parseInt(invoiceId, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid invoice ID.');
    error.status = 400;
    throw error;
  }

  // Fetch invoice & verify user ownership
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      project: {
        client: {
          userId,
        },
      },
    },
    include: {
      payments: true,
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!invoice) {
    const error = new Error('Invoice not found or access denied.');
    error.status = 404;
    throw error;
  }

  const amountPaid = parseFloat(paymentData.amountPaid);
  if (isNaN(amountPaid) || amountPaid <= 0) {
    const error = new Error('Amount paid must be a positive number.');
    error.status = 400;
    throw error;
  }

  const paymentDate = paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date();
  const paymentMethod = paymentData.paymentMethod || 'UPI';
  const referenceId = paymentData.referenceId?.trim() || null;
  const notes = paymentData.notes?.trim() || null;

  // Create payment entry
  const payment = await prisma.payment.create({
    data: {
      invoiceId: id,
      amountPaid,
      paymentMethod,
      referenceId,
      notes,
      paymentDate,
    },
  });

  // Recalculate total paid
  const previousPaidSum = invoice.payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalPaid = previousPaidSum + amountPaid;

  // Calculate new status
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  let newStatus = invoice.status;

  if (totalPaid >= invoice.amount && invoice.amount > 0) {
    newStatus = 'Paid';
  } else if (totalPaid > 0) {
    if (dueDate < now) {
      newStatus = 'Overdue';
    } else {
      newStatus = 'Partially Paid';
    }
  } else {
    if (dueDate < now) {
      newStatus = 'Overdue';
    } else {
      newStatus = 'Pending';
    }
  }

  // Update invoice status
  const updatedInvoice = await prisma.invoice.update({
    where: { id },
    data: { status: newStatus },
    include: {
      project: {
        include: {
          client: true,
        },
      },
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
    },
  });

  return {
    payment,
    invoice: updatedInvoice,
  };
};

/**
 * Get all payment records for user with search and filtering
 */
const getAllPayments = async (userId, filters = {}) => {
  const where = {
    invoice: {
      project: {
        client: {
          userId,
        },
      },
    },
  };

  if (filters.clientId) {
    const clientId = parseInt(filters.clientId, 10);
    if (!isNaN(clientId)) {
      where.invoice.project.clientId = clientId;
    }
  }

  if (filters.paymentMethod && filters.paymentMethod !== 'All') {
    where.paymentMethod = filters.paymentMethod;
  }

  if (filters.q) {
    const query = filters.q.trim();
    where.OR = [
      { referenceId: { contains: query } },
      { notes: { contains: query } },
      { invoice: { invoiceNumber: { contains: query } } },
      { invoice: { project: { client: { name: { contains: query } } } } },
      { invoice: { project: { client: { company: { contains: query } } } } },
    ];
  }

  // Fetch payments
  const payments = await prisma.payment.findMany({
    where,
    include: {
      invoice: {
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      },
    },
    orderBy: {
      paymentDate: 'desc',
    },
  });

  // Calculate summary metrics for User's Payments Ledger
  const allUserInvoices = await prisma.invoice.findMany({
    where: {
      project: {
        client: {
          userId,
        },
      },
    },
    include: {
      payments: true,
    },
  });

  let totalReceived = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;
  const now = new Date();

  allUserInvoices.forEach(inv => {
    const paid = inv.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    totalReceived += paid;
    const remaining = Math.max(0, inv.amount - paid);
    totalOutstanding += remaining;

    if (remaining > 0 && new Date(inv.dueDate) < now) {
      totalOverdue += remaining;
    }
  });

  return {
    payments,
    summary: {
      totalReceived,
      totalOutstanding,
      totalOverdue,
      paymentCount: payments.length,
    },
  };
};

/**
 * Delete a payment record and recalculate invoice status
 */
const deletePayment = async (userId, paymentId) => {
  const id = parseInt(paymentId, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid payment ID.');
    error.status = 400;
    throw error;
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id,
      invoice: {
        project: {
          client: {
            userId,
          },
        },
      },
    },
    include: {
      invoice: {
        include: {
          payments: true,
        },
      },
    },
  });

  if (!payment) {
    const error = new Error('Payment record not found or access denied.');
    error.status = 404;
    throw error;
  }

  const invoiceId = payment.invoiceId;

  // Delete payment
  await prisma.payment.delete({
    where: { id },
  });

  // Recalculate remaining payments for this invoice
  const remainingPayments = await prisma.payment.findMany({
    where: { invoiceId },
  });

  const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const invoice = payment.invoice;
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  let newStatus = 'Pending';

  if (totalPaid >= invoice.amount && invoice.amount > 0) {
    newStatus = 'Paid';
  } else if (totalPaid > 0) {
    if (dueDate < now) {
      newStatus = 'Overdue';
    } else {
      newStatus = 'Partially Paid';
    }
  } else {
    if (dueDate < now) {
      newStatus = 'Overdue';
    } else {
      newStatus = 'Pending';
    }
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: newStatus },
    include: {
      payments: true,
      project: {
        include: { client: true },
      },
    },
  });

  return {
    message: 'Payment record deleted successfully.',
    invoice: updatedInvoice,
  };
};

module.exports = {
  recordPayment,
  getAllPayments,
  deletePayment,
};
