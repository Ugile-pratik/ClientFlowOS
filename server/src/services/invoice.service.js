const prisma = require('../config/db');

/**
 * Generate a unique sequential Invoice Number (e.g. INV-2026-001)
 */
const generateInvoiceNumber = async () => {
  const count = await prisma.invoice.count();
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(3, '0');
  let candidate = `INV-${year}-${sequence}`;

  // Ensure uniqueness in case of deleted invoices
  let existing = await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } });
  let offset = 1;
  while (existing) {
    const nextSeq = String(count + 1 + offset).padStart(3, '0');
    candidate = `INV-${year}-${nextSeq}`;
    existing = await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } });
    offset++;
  }
  return candidate;
};

/**
 * Calculate invoice subtotal, tax, and total amount
 */
const calculateInvoiceTotals = (data) => {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems.map(item => {
    const qty = parseFloat(item.qty) || 1;
    const rate = parseFloat(item.rate) || 0;
    const amount = item.amount ? parseFloat(item.amount) : qty * rate;
    return {
      description: item.description || '',
      qty,
      rate,
      amount
    };
  });

  let subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  if (subtotal === 0 && data.amount) {
    subtotal = parseFloat(data.amount);
  }

  const discount = parseFloat(data.discount) || 0;
  const taxRate = parseFloat(data.taxRate) || 0;
  const taxable = Math.max(0, subtotal - discount);
  const taxAmount = Math.round(taxable * (taxRate / 100));
  const totalAmount = Math.max(0, taxable + taxAmount);

  return {
    items,
    subtotal,
    discount,
    taxRate,
    taxAmount,
    totalAmount: totalAmount > 0 ? totalAmount : parseFloat(data.amount) || 0
  };
};

/**
 * Create a new invoice
 */
const createInvoice = async (userId, invoiceData) => {
  const projectId = parseInt(invoiceData.projectId, 10);
  if (isNaN(projectId)) {
    const error = new Error('Invalid project ID.');
    error.status = 400;
    throw error;
  }

  // Verify project belongs to user
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      client: {
        userId,
      },
    },
    include: {
      client: true,
    },
  });

  if (!project) {
    const error = new Error('Project not found or access denied.');
    error.status = 404;
    throw error;
  }

  const invoiceNumber = invoiceData.invoiceNumber?.trim() || (await generateInvoiceNumber());
  const totals = calculateInvoiceTotals(invoiceData);

  let initialAmountPaid = 0;
  if (invoiceData.amountPaid !== undefined && invoiceData.amountPaid !== null && invoiceData.amountPaid !== '') {
    initialAmountPaid = parseFloat(invoiceData.amountPaid) || 0;
  } else if (invoiceData.status === 'Paid') {
    initialAmountPaid = totals.totalAmount;
  }

  let calculatedStatus = invoiceData.status || 'Pending';
  if (initialAmountPaid >= totals.totalAmount && totals.totalAmount > 0) {
    calculatedStatus = 'Paid';
  } else if (initialAmountPaid > 0) {
    calculatedStatus = 'Partially Paid';
  }

  const invoiceDate = invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date();

  const createdInvoice = await prisma.invoice.create({
    data: {
      projectId,
      invoiceNumber,
      invoiceDate,
      dueDate: new Date(invoiceData.dueDate),
      items: totals.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      amount: totals.totalAmount,
      notes: invoiceData.notes || null,
      status: calculatedStatus,
    },
  });

  if (initialAmountPaid > 0) {
    await prisma.payment.create({
      data: {
        invoiceId: createdInvoice.id,
        amountPaid: initialAmountPaid,
        paymentMethod: invoiceData.paymentMethod || 'Bank Transfer',
        referenceId: invoiceData.referenceId || null,
        notes: invoiceData.paymentNotes || null,
        paymentDate: new Date(),
      },
    });
  }

  return await prisma.invoice.findUnique({
    where: { id: createdInvoice.id },
    include: {
      project: {
        include: {
          client: true,
        },
      },
      payments: {
        orderBy: {
          paymentDate: 'desc',
        },
      },
    },
  });
};

/**
 * Fetch all invoices for logged-in user with filters
 */
const getInvoices = async (userId, filters = {}) => {
  const where = {
    project: {
      client: {
        userId,
      },
    },
  };

  if (filters.status && filters.status !== 'All') {
    where.status = filters.status;
  }

  if (filters.projectId) {
    const parsedProjectId = parseInt(filters.projectId, 10);
    if (!isNaN(parsedProjectId)) {
      where.projectId = parsedProjectId;
    }
  }

  if (filters.clientId) {
    const parsedClientId = parseInt(filters.clientId, 10);
    if (!isNaN(parsedClientId)) {
      where.project = {
        ...where.project,
        clientId: parsedClientId,
      };
    }
  }

  if (filters.q) {
    const query = filters.q.trim();
    where.OR = [
      { invoiceNumber: { contains: query } },
      { project: { title: { contains: query } } },
      { project: { client: { name: { contains: query } } } },
      { project: { client: { company: { contains: query } } } },
    ];
  }

  return await prisma.invoice.findMany({
    where,
    include: {
      project: {
        include: {
          client: true,
        },
      },
      payments: {
        orderBy: {
          paymentDate: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/**
 * Fetch single invoice by ID
 */
const getInvoiceById = async (userId, invoiceId) => {
  const id = parseInt(invoiceId, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid invoice ID.');
    error.status = 400;
    throw error;
  }

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
      project: {
        include: {
          client: true,
        },
      },
      payments: {
        orderBy: {
          paymentDate: 'desc',
        },
      },
    },
  });

  if (!invoice) {
    const error = new Error('Invoice not found or access denied.');
    error.status = 404;
    throw error;
  }

  return invoice;
};

/**
 * Update invoice
 */
const updateInvoice = async (userId, invoiceId, invoiceData) => {
  const id = parseInt(invoiceId, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid invoice ID.');
    error.status = 400;
    throw error;
  }

  const existingInvoice = await prisma.invoice.findFirst({
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
    },
  });

  if (!existingInvoice) {
    const error = new Error('Invoice not found or access denied.');
    error.status = 404;
    throw error;
  }

  const projectId = parseInt(invoiceData.projectId, 10);
  const totals = calculateInvoiceTotals(invoiceData);
  const currentTotalPaid = existingInvoice.payments.reduce((sum, p) => sum + p.amountPaid, 0);

  let targetAmountPaid = currentTotalPaid;

  if (invoiceData.amountPaid !== undefined && invoiceData.amountPaid !== null && invoiceData.amountPaid !== '') {
    targetAmountPaid = parseFloat(invoiceData.amountPaid) || 0;
  } else if (invoiceData.status === 'Paid') {
    targetAmountPaid = totals.totalAmount;
  } else if (invoiceData.status === 'Unpaid') {
    targetAmountPaid = 0;
  }

  const diff = targetAmountPaid - currentTotalPaid;

  if (diff > 0) {
    await prisma.payment.create({
      data: {
        invoiceId: id,
        amountPaid: diff,
        paymentMethod: invoiceData.paymentMethod || 'Bank Transfer',
        referenceId: invoiceData.referenceId || null,
        notes: invoiceData.paymentNotes || null,
        paymentDate: new Date(),
      },
    });
  } else if (diff < 0) {
    await prisma.payment.deleteMany({ where: { invoiceId: id } });
    if (targetAmountPaid > 0) {
      await prisma.payment.create({
        data: {
          invoiceId: id,
          amountPaid: targetAmountPaid,
          paymentMethod: 'Bank Transfer',
          paymentDate: new Date(),
        },
      });
    }
  }

  let finalStatus = invoiceData.status || existingInvoice.status;
  if (targetAmountPaid >= totals.totalAmount && totals.totalAmount > 0) {
    finalStatus = 'Paid';
  } else if (targetAmountPaid > 0) {
    finalStatus = 'Partially Paid';
  } else if (targetAmountPaid === 0 && !['Draft', 'Sent', 'Overdue', 'Cancelled'].includes(finalStatus)) {
    finalStatus = 'Pending';
  }

  const invoiceDate = invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : existingInvoice.invoiceDate;

  return await prisma.invoice.update({
    where: { id },
    data: {
      projectId,
      invoiceDate,
      dueDate: new Date(invoiceData.dueDate),
      items: totals.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      amount: totals.totalAmount,
      notes: invoiceData.notes !== undefined ? invoiceData.notes : existingInvoice.notes,
      status: finalStatus,
    },
    include: {
      project: {
        include: {
          client: true,
        },
      },
      payments: {
        orderBy: {
          paymentDate: 'desc',
        },
      },
    },
  });
};

/**
 * Delete invoice
 */
const deleteInvoice = async (userId, invoiceId) => {
  const id = parseInt(invoiceId, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid invoice ID.');
    error.status = 400;
    throw error;
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      project: {
        client: {
          userId,
        },
      },
    },
  });

  if (!invoice) {
    const error = new Error('Invoice not found or access denied.');
    error.status = 404;
    throw error;
  }

  await prisma.invoice.delete({
    where: { id },
  });

  return { message: 'Invoice deleted successfully.' };
};

/**
 * Record a payment against an invoice and update invoice status
 */
const recordPayment = async (userId, invoiceId, paymentData) => {
  const id = parseInt(invoiceId, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid invoice ID.');
    error.status = 400;
    throw error;
  }

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
    },
  });

  if (!invoice) {
    const error = new Error('Invoice not found or access denied.');
    error.status = 404;
    throw error;
  }

  const amountPaid = parseFloat(paymentData.amountPaid);
  const paymentDate = paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date();

  // Create payment record
  await prisma.payment.create({
    data: {
      invoiceId: id,
      amountPaid,
      paymentMethod: paymentData.paymentMethod || 'Bank Transfer',
      referenceId: paymentData.referenceId || null,
      notes: paymentData.notes || null,
      paymentDate,
    },
  });

  // Calculate new total paid
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amountPaid, 0) + amountPaid;

  // Determine new invoice status
  let newStatus = invoice.status;
  if (totalPaid >= invoice.amount) {
    newStatus = 'Paid';
  } else if (totalPaid > 0) {
    newStatus = 'Partially Paid';
  }

  // Update invoice status
  return await prisma.invoice.update({
    where: { id },
    data: {
      status: newStatus,
    },
    include: {
      project: {
        include: {
          client: true,
        },
      },
      payments: {
        orderBy: {
          paymentDate: 'desc',
        },
      },
    },
  });
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  recordPayment,
};
