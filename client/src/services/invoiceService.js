import axios from 'axios';

// Helper to determine if we are in local frontend mock testing mode
const isMockMode = () => {
  return localStorage.getItem('clientflow-token') === 'mock-jwt-token-for-local-testing';
};

// Seed initial mock invoices if not present
const getMockInvoices = () => {
  const stored = localStorage.getItem('clientflow-mock-invoices');
  if (stored) return JSON.parse(stored);

  const initial = [
    {
      id: 301,
      projectId: 201,
      invoiceNumber: 'INV-2026-001',
      invoiceDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Partially Paid',
      items: [
        { description: 'Website UI Redesign & Wireframes', qty: 1, rate: 40000, amount: 40000 },
        { description: 'Frontend React Development', qty: 1, rate: 20000, amount: 20000 }
      ],
      subtotal: 60000,
      discount: 0,
      taxRate: 18,
      taxAmount: 10800,
      amount: 70800,
      notes: 'Payment Terms: 50% Advance, 50% upon project completion.',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      project: {
        id: 201,
        title: 'E-Commerce Website Redesign',
        client: {
          id: 101,
          name: 'John Doe',
          company: 'Acme Corporation',
          email: 'billing@acme.com',
          phone: '+91 98765 43210',
          address: '123 Tech Park, Sector 4',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postalCode: '400001',
          gstNumber: '27AAAAA1111A1Z1'
        },
      },
      payments: [
        {
          id: 401,
          invoiceId: 301,
          amountPaid: 35400,
          paymentMethod: 'UPI',
          referenceId: 'UPI-9842103984',
          notes: 'Advance 50% deposit received',
          paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    },
    {
      id: 302,
      projectId: 202,
      invoiceNumber: 'INV-2026-002',
      invoiceDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Overdue',
      items: [
        { description: 'Security Vulnerability Scan', qty: 1, rate: 75000, amount: 75000 },
        { description: 'Code Audit & Remediation Report', qty: 1, rate: 50000, amount: 50000 }
      ],
      subtotal: 125000,
      discount: 5000,
      taxRate: 18,
      taxAmount: 21600,
      amount: 141600,
      notes: 'Net 30 payment schedule.',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      project: {
        id: 202,
        title: 'Mobile App Security Audit',
        client: {
          id: 102,
          name: 'Bruce Wayne',
          company: 'Wayne Enterprises',
          email: 'finance@waynecorp.com',
          phone: '+1 555-0199',
          address: '1007 Mountain Drive',
          city: 'Gotham',
          state: 'New Jersey',
          country: 'USA',
          postalCode: '07001',
          gstNumber: ''
        },
      },
      payments: []
    },
    {
      id: 303,
      projectId: 203,
      invoiceNumber: 'INV-2026-003',
      invoiceDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Paid',
      items: [
        { description: 'Brand Logo & Typography Guidelines', qty: 1, rate: 85000, amount: 85000 }
      ],
      subtotal: 85000,
      discount: 0,
      taxRate: 18,
      taxAmount: 15300,
      amount: 100300,
      notes: 'Thank you for your business!',
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      project: {
        id: 203,
        title: 'Brand Identity & Guidelines',
        client: {
          id: 103,
          name: 'Pepper Potts',
          company: 'Stark Industries',
          email: 'pepper@stark.com',
          phone: '+1 555-0100',
          address: '10880 Wilshire Blvd',
          city: 'Los Angeles',
          state: 'California',
          country: 'USA',
          postalCode: '90024',
          gstNumber: ''
        },
      },
      payments: [
        {
          id: 402,
          invoiceId: 303,
          amountPaid: 100300,
          paymentMethod: 'Bank Transfer',
          referenceId: 'NEFT-88301294',
          notes: 'Full payment via NEFT',
          paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    }
  ];

  localStorage.setItem('clientflow-mock-invoices', JSON.stringify(initial));
  return initial;
};

const saveMockInvoices = (invoices) => {
  localStorage.setItem('clientflow-mock-invoices', JSON.stringify(invoices));
};

const calculateTotals = (data) => {
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

export const getInvoices = async (params = {}) => {
  if (isMockMode()) {
    let list = getMockInvoices();

    // Filter status
    if (params.status && params.status !== 'All') {
      list = list.filter(i => i.status.toLowerCase() === params.status.toLowerCase());
    }

    // Filter projectId
    if (params.projectId) {
      list = list.filter(i => i.projectId === parseInt(params.projectId, 10));
    }

    // Filter keyword search
    if (params.q) {
      const q = params.q.toLowerCase().trim();
      list = list.filter(i =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.project?.title?.toLowerCase().includes(q) ||
        i.project?.client?.name?.toLowerCase().includes(q) ||
        i.project?.client?.company?.toLowerCase().includes(q)
      );
    }

    return list;
  }

  const response = await axios.get('/api/invoices', { params });
  return response.data;
};

export const getInvoiceById = async (id) => {
  if (isMockMode()) {
    const list = getMockInvoices();
    const invoice = list.find(i => i.id === parseInt(id, 10));
    if (!invoice) throw new Error('Invoice not found.');
    return invoice;
  }

  const response = await axios.get(`/api/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (invoiceData) => {
  if (isMockMode()) {
    const list = getMockInvoices();

    const count = list.length + 1;
    const year = new Date().getFullYear();
    const generatedNum = `INV-${year}-${String(count).padStart(3, '0')}`;
    const totals = calculateTotals(invoiceData);

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

    const payments = [];
    if (initialAmountPaid > 0) {
      payments.push({
        id: Date.now(),
        invoiceId: Date.now(),
        amountPaid: initialAmountPaid,
        paymentMethod: invoiceData.paymentMethod || 'Bank Transfer',
        referenceId: invoiceData.referenceId || null,
        notes: invoiceData.paymentNotes || null,
        paymentDate: new Date().toISOString()
      });
    }

    const newInvoice = {
      id: Date.now(),
      projectId: parseInt(invoiceData.projectId, 10),
      project: invoiceData.project || { title: 'Assigned Project', client: { name: 'Client' } },
      invoiceNumber: invoiceData.invoiceNumber?.trim() || generatedNum,
      invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toISOString() : new Date().toISOString(),
      dueDate: new Date(invoiceData.dueDate).toISOString(),
      items: totals.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      amount: totals.totalAmount,
      notes: invoiceData.notes || '',
      status: calculatedStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments
    };

    list.unshift(newInvoice);
    saveMockInvoices(list);
    return newInvoice;
  }

  const response = await axios.post('/api/invoices', invoiceData);
  return response.data;
};

export const updateInvoice = async (id, invoiceData) => {
  if (isMockMode()) {
    const list = getMockInvoices();
    const index = list.findIndex(i => i.id === parseInt(id, 10));
    if (index === -1) throw new Error('Invoice not found.');

    const invoice = list[index];
    const totals = calculateTotals(invoiceData);
    const currentPaid = (invoice.payments || []).reduce((sum, p) => sum + p.amountPaid, 0);

    let targetAmountPaid = currentPaid;
    if (invoiceData.amountPaid !== undefined && invoiceData.amountPaid !== null && invoiceData.amountPaid !== '') {
      targetAmountPaid = parseFloat(invoiceData.amountPaid) || 0;
    } else if (invoiceData.status === 'Paid') {
      targetAmountPaid = totals.totalAmount;
    } else if (invoiceData.status === 'Unpaid') {
      targetAmountPaid = 0;
    }

    let updatedPayments = [...(invoice.payments || [])];
    const diff = targetAmountPaid - currentPaid;

    if (diff > 0) {
      updatedPayments.unshift({
        id: Date.now(),
        invoiceId: invoice.id,
        amountPaid: diff,
        paymentMethod: invoiceData.paymentMethod || 'Bank Transfer',
        referenceId: invoiceData.referenceId || null,
        notes: invoiceData.paymentNotes || null,
        paymentDate: new Date().toISOString()
      });
    } else if (diff < 0) {
      if (targetAmountPaid === 0) {
        updatedPayments = [];
      } else {
        updatedPayments = [{
          id: Date.now(),
          invoiceId: invoice.id,
          amountPaid: targetAmountPaid,
          paymentMethod: 'Bank Transfer',
          referenceId: null,
          notes: null,
          paymentDate: new Date().toISOString()
        }];
      }
    }

    let finalStatus = invoiceData.status || invoice.status;
    if (targetAmountPaid >= totals.totalAmount && totals.totalAmount > 0) {
      finalStatus = 'Paid';
    } else if (targetAmountPaid > 0) {
      finalStatus = 'Partially Paid';
    } else if (targetAmountPaid === 0 && !['Draft', 'Sent', 'Overdue', 'Cancelled'].includes(finalStatus)) {
      finalStatus = 'Pending';
    }

    const updatedInvoice = {
      ...invoice,
      ...invoiceData,
      projectId: parseInt(invoiceData.projectId, 10),
      items: totals.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      amount: totals.totalAmount,
      dueDate: new Date(invoiceData.dueDate).toISOString(),
      status: finalStatus,
      payments: updatedPayments,
      updatedAt: new Date().toISOString()
    };

    list[index] = updatedInvoice;
    saveMockInvoices(list);
    return updatedInvoice;
  }

  const response = await axios.put(`/api/invoices/${id}`, invoiceData);
  return response.data;
};

export const deleteInvoice = async (id) => {
  if (isMockMode()) {
    let list = getMockInvoices();
    const exists = list.some(i => i.id === parseInt(id, 10));
    if (!exists) throw new Error('Invoice not found.');

    list = list.filter(i => i.id !== parseInt(id, 10));
    saveMockInvoices(list);
    return { message: 'Invoice deleted successfully.' };
  }

  const response = await axios.delete(`/api/invoices/${id}`);
  return response.data;
};

export const recordPayment = async (id, paymentData) => {
  if (isMockMode()) {
    const list = getMockInvoices();
    const index = list.findIndex(i => i.id === parseInt(id, 10));
    if (index === -1) throw new Error('Invoice not found.');

    const invoice = list[index];
    const amountPaid = parseFloat(paymentData.amountPaid);
    const newPayment = {
      id: Date.now(),
      invoiceId: invoice.id,
      amountPaid,
      paymentMethod: paymentData.paymentMethod || 'Bank Transfer',
      referenceId: paymentData.referenceId || null,
      notes: paymentData.notes || null,
      paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate).toISOString() : new Date().toISOString()
    };

    const updatedPayments = [newPayment, ...(invoice.payments || [])];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amountPaid, 0);

    let newStatus = invoice.status;
    if (totalPaid >= invoice.amount) {
      newStatus = 'Paid';
    } else if (totalPaid > 0) {
      newStatus = 'Partially Paid';
    }

    const updatedInvoice = {
      ...invoice,
      status: newStatus,
      payments: updatedPayments,
      updatedAt: new Date().toISOString()
    };

    list[index] = updatedInvoice;
    saveMockInvoices(list);
    return updatedInvoice;
  }

  const response = await axios.post(`/api/invoices/${id}/payments`, paymentData);
  return response.data;
};
