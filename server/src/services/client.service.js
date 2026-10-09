const prisma = require('../config/db');

/**
 * Create a new client profile
 */
const createClient = async (userId, clientData) => {
  const email = clientData.email.trim();

  // Check if email already exists for this user
  const existingClient = await prisma.client.findFirst({
    where: {
      userId,
      email,
    },
  });

  if (existingClient) {
    const error = new Error('A client with this email address already exists.');
    error.status = 400;
    throw error;
  }

  return await prisma.client.create({
    data: {
      userId,
      company: clientData.company,
      name: clientData.name,
      email,
      phone: clientData.phone,
      address: clientData.address,
      city: clientData.city,
      state: clientData.state,
      country: clientData.country,
      postalCode: clientData.postalCode,
      gstNumber: clientData.gstNumber || null,
      notes: clientData.notes || null,
      status: clientData.status || 'Lead',
      tags: clientData.tags || [],
    },
  });
};

/**
 * Fetch all clients with optional status filter and search query
 */
const getClients = async (userId, filters = {}) => {
  const where = { userId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.q) {
    const query = filters.q.trim();
    where.OR = [
      { name: { contains: query } },
      { company: { contains: query } },
      { email: { contains: query } },
    ];
  }

  return await prisma.client.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/**
 * Fetch a single client profile by ID
 */
const getClientById = async (userId, clientId) => {
  const id = parseInt(clientId, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid client ID.');
    error.status = 400;
    throw error;
  }

  const client = await prisma.client.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      projects: {
        include: {
          invoices: {
            include: {
              payments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!client) {
    const error = new Error('Client not found.');
    error.status = 404;
    throw error;
  }

  // Calculate real client-specific metrics and activity timeline
  const totalProjects = client.projects.length;
  let totalRevenue = 0;
  let pendingPayments = 0;
  let lastPaymentDate = null;
  const activities = [];

  // 1. Client creation activity
  activities.push({
    id: `client-created-${client.id}`,
    type: 'CLIENT_CREATED',
    title: 'Client Profile Created',
    description: `Registered with status: ${client.status || 'Lead'}`,
    date: client.createdAt,
    color: 'text.secondary',
  });

  // 2. Client update activity (if updated after created)
  if (client.updatedAt && new Date(client.updatedAt).getTime() - new Date(client.createdAt).getTime() > 60000) {
    activities.push({
      id: `client-updated-${client.id}`,
      type: 'CLIENT_UPDATED',
      title: 'Client Profile Updated',
      description: 'Contact or address details verified and saved',
      date: client.updatedAt,
      color: 'info.main',
    });
  }

  // 3. Process project, invoice, and payment activities
  client.projects.forEach((project) => {
    activities.push({
      id: `project-${project.id}`,
      type: 'PROJECT_CREATED',
      title: `Project '${project.title}' Created`,
      description: `Budget: ₹${(project.budget || 0).toLocaleString('en-IN')} • Status: ${project.status}`,
      date: project.createdAt,
      color: 'primary.main',
    });

    project.invoices.forEach((invoice) => {
      let paidOnInvoice = 0;
      invoice.payments.forEach((payment) => {
        paidOnInvoice += payment.amountPaid || 0;
        totalRevenue += payment.amountPaid || 0;

        const pDate = new Date(payment.paymentDate || payment.createdAt);
        if (!lastPaymentDate || pDate > new Date(lastPaymentDate)) {
          lastPaymentDate = pDate;
        }

        activities.push({
          id: `payment-${payment.id}`,
          type: 'PAYMENT_RECEIVED',
          title: `Payment Received (${payment.paymentMethod || 'Direct'})`,
          description: `₹${(payment.amountPaid || 0).toLocaleString('en-IN')} recorded for Invoice #${invoice.invoiceNumber}${payment.referenceId ? ` (Ref: ${payment.referenceId})` : ''}`,
          date: payment.paymentDate || payment.createdAt,
          color: 'success.main',
        });
      });

      const remainingBalance = (invoice.amount || 0) - paidOnInvoice;
      if (remainingBalance > 0 && invoice.status !== 'Paid') {
        pendingPayments += remainingBalance;
      }

      activities.push({
        id: `invoice-${invoice.id}`,
        type: 'INVOICE_CREATED',
        title: `Invoice #${invoice.invoiceNumber} Generated`,
        description: `Amount: ₹${(invoice.amount || 0).toLocaleString('en-IN')} • Status: ${invoice.status}`,
        date: invoice.invoiceDate || invoice.createdAt,
        color: 'warning.main',
      });
    });
  });

  // Sort activities chronologically descending (newest activity first)
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    ...client,
    totalProjects,
    totalRevenue,
    pendingPayments,
    lastPaymentDate,
    activities,
  };
};

/**
 * Update a client profile by ID
 */
const updateClient = async (userId, clientId, clientData) => {
  const id = parseInt(clientId, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid client ID.');
    error.status = 400;
    throw error;
  }

  // Verify client ownership
  const client = await prisma.client.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!client) {
    const error = new Error('Client not found or access denied.');
    error.status = 404;
    throw error;
  }

  // Check email uniqueness if email is provided and changed
  const email = clientData.email ? clientData.email.trim() : client.email;
  if (email && email.toLowerCase() !== client.email.toLowerCase()) {
    const existingClient = await prisma.client.findFirst({
      where: {
        userId,
        email,
        id: { not: id },
      },
    });

    if (existingClient) {
      const error = new Error('A client with this email address already exists.');
      error.status = 400;
      throw error;
    }
  }

  return await prisma.client.update({
    where: { id },
    data: {
      company: clientData.company !== undefined ? clientData.company : client.company,
      name: clientData.name !== undefined ? clientData.name : client.name,
      email: email || client.email,
      phone: clientData.phone !== undefined ? clientData.phone : client.phone,
      address: clientData.address !== undefined ? clientData.address : client.address,
      city: clientData.city !== undefined ? clientData.city : client.city,
      state: clientData.state !== undefined ? clientData.state : client.state,
      country: clientData.country !== undefined ? clientData.country : client.country,
      postalCode: clientData.postalCode !== undefined ? clientData.postalCode : client.postalCode,
      gstNumber: clientData.gstNumber !== undefined ? (clientData.gstNumber || null) : client.gstNumber,
      notes: clientData.notes !== undefined ? (clientData.notes || null) : client.notes,
      status: clientData.status !== undefined ? clientData.status : client.status,
      tags: clientData.tags !== undefined ? clientData.tags : (client.tags || []),
    },
  });
};

/**
 * Delete a client profile by ID
 */
const deleteClient = async (userId, clientId) => {
  const id = parseInt(clientId, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid client ID.');
    error.status = 400;
    throw error;
  }

  // Verify client ownership
  const client = await prisma.client.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!client) {
    const error = new Error('Client not found or access denied.');
    error.status = 404;
    throw error;
  }

  await prisma.client.delete({
    where: { id },
  });

  return { message: 'Client deleted successfully.' };
};

/**
 * Keyword search for clients
 */
const searchClients = async (userId, query = '') => {
  const cleanedQuery = query.trim();
  if (!cleanedQuery) {
    return await prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  return await prisma.client.findMany({
    where: {
      userId,
      OR: [
        { name: { contains: cleanedQuery } },
        { company: { contains: cleanedQuery } },
        { email: { contains: cleanedQuery } },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  searchClients,
};
