const prisma = require('../config/db');

/**
 * Generates real-time notifications driven strictly by the Invoice Payment Lifecycle.
 * Evaluates remaining balance (remaining = amount - paidSum) and milestone dates.
 * Applies a strict 14-day retention filter and caps at 30 items max to preserve memory.
 */
const getNotifications = async (userId) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight truncated
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const notifications = [];

  // 1. Fetch user's settings to respect notification preferences (with defaults)
  const userSettings = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      notifyInvoiceDue: true,
      notifyPaymentReceived: true,
      notifyProjectDeadlines: true,
      notifyAiInsights: true,
    },
  });

  const notifyInvoiceDue = userSettings?.notifyInvoiceDue ?? true;
  const notifyPaymentReceived = userSettings?.notifyPaymentReceived ?? true;
  const notifyProjectDeadlines = userSettings?.notifyProjectDeadlines ?? true;
  const notifyAiInsights = userSettings?.notifyAiInsights ?? true;

  // 2. Fetch Invoices with payments and project/client details
  const invoices = await prisma.invoice.findMany({
    where: {
      project: {
        client: {
          userId,
        },
      },
    },
    include: {
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
      project: {
        include: {
          client: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  invoices.forEach((inv) => {
    const paidSum = inv.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const remainingBalance = Math.max(0, inv.amount - paidSum);
    const invDueDate = new Date(inv.dueDate);
    const dueDate = new Date(invDueDate.getFullYear(), invDueDate.getMonth(), invDueDate.getDate());
    const clientName = inv.project?.client?.name || inv.project?.client?.company || 'Client';

    const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24)); // >0 future, <0 overdue

    // -------------------------------------------------------------
    // FULLY PAID INVOICE NOTIFICATIONS
    // -------------------------------------------------------------
    if (remainingBalance === 0) {
      if (notifyPaymentReceived && inv.payments.length > 0) {
        const latestPayment = inv.payments[0];
        if (new Date(latestPayment.paymentDate) >= fourteenDaysAgo) {
          notifications.push({
            id: `notif_full_pay_${inv.id}`,
            category: 'Payments',
            type: 'PAYMENT_RECEIVED',
            severity: 'success', // 🟢 Green
            title: `Payment Received`,
            message: `₹${latestPayment.amountPaid.toLocaleString()} recorded for #${inv.invoiceNumber}. Invoice is now fully paid.`,
            timestamp: new Date(latestPayment.paymentDate),
            read: true,
            action: { label: 'View Invoice', route: `/invoices/${inv.id}` },
          });
        }
      }
      // Suppress all future payment due & overdue notifications for fully paid invoices!
      return;
    }

    // -------------------------------------------------------------
    // PARTIAL PAYMENT NOTIFICATION
    // -------------------------------------------------------------
    if (paidSum > 0 && remainingBalance > 0 && notifyPaymentReceived) {
      const latestPayment = inv.payments[0];
      if (new Date(latestPayment.paymentDate) >= fourteenDaysAgo) {
        notifications.push({
          id: `notif_part_pay_${latestPayment.id}`,
          category: 'Payments',
          type: 'PARTIAL_PAYMENT',
          severity: 'warning', // 🟡 Yellow
          title: `Partial Payment Recorded`,
          message: `₹${latestPayment.amountPaid.toLocaleString()} recorded for #${inv.invoiceNumber}. ₹${remainingBalance.toLocaleString()} remains outstanding.`,
          timestamp: new Date(latestPayment.paymentDate),
          read: false,
          action: { label: 'View Invoice', route: `/invoices/${inv.id}` },
        });
      }
    }

    // -------------------------------------------------------------
    // INVOICE CREATED NOTIFICATION (Single instance within 14 days)
    // -------------------------------------------------------------
    if (new Date(inv.createdAt) >= fourteenDaysAgo && paidSum === 0) {
      notifications.push({
        id: `notif_created_${inv.id}`,
        category: 'Invoices',
        type: 'INVOICE_CREATED',
        severity: 'success', // 🟢 Green
        title: `Invoice Created`,
        message: `#${inv.invoiceNumber} (₹${inv.amount.toLocaleString()}) created for ${clientName}. Due: ${dueDate.toLocaleDateString('en-IN')}`,
        timestamp: new Date(inv.createdAt),
        read: true,
        action: { label: 'View Invoice', route: `/invoices/${inv.id}` },
      });
    }

    // -------------------------------------------------------------
    // LIFECYCLE DUE DATE & OVERDUE MILESTONE REMINDERS
    // -------------------------------------------------------------
    if (notifyInvoiceDue && remainingBalance > 0) {
      // 7 Days Before Due
      if (diffDays === 7) {
        notifications.push({
          id: `notif_due_7d_${inv.id}`,
          category: 'Alerts',
          type: 'DUE_7_DAYS',
          severity: 'warning', // 🟡 Yellow
          title: `Payment Due in 7 Days`,
          message: `#${inv.invoiceNumber} · ${clientName}: ₹${remainingBalance.toLocaleString()} is due on ${dueDate.toLocaleDateString('en-IN')}.`,
          timestamp: today,
          read: false,
          action: { label: 'View Invoice', route: `/invoices/${inv.id}` },
        });
      }

      // 3 Days Before Due
      else if (diffDays === 3) {
        notifications.push({
          id: `notif_due_3d_${inv.id}`,
          category: 'Alerts',
          type: 'DUE_3_DAYS',
          severity: 'warning', // 🟠 Orange
          title: `Payment Due Soon`,
          message: `₹${remainingBalance.toLocaleString()} for #${inv.invoiceNumber} is due in 3 days.`,
          timestamp: today,
          read: false,
          action: { label: 'View Invoice', route: `/invoices/${inv.id}` },
        });
      }

      // Due Today
      else if (diffDays === 0) {
        notifications.push({
          id: `notif_due_today_${inv.id}`,
          category: 'Alerts',
          type: 'DUE_TODAY',
          severity: 'error', // 🔴 Red
          title: `Payment Due Today`,
          message: `₹${remainingBalance.toLocaleString()} for #${inv.invoiceNumber} is due today.`,
          timestamp: today,
          read: false,
          action: { label: 'View Invoice', route: `/invoices/${inv.id}` },
        });
      }

      // Overdue — 1 Day
      else if (diffDays === -1) {
        notifications.push({
          id: `notif_overdue_1d_${inv.id}`,
          category: 'Alerts',
          type: 'OVERDUE_1D',
          severity: 'error', // 🔴 Red
          title: `Payment Overdue`,
          message: `#${inv.invoiceNumber} is 1 day overdue. Outstanding: ₹${remainingBalance.toLocaleString()}.`,
          timestamp: today,
          read: false,
          action: { label: 'View Invoice', route: `/invoices/${inv.id}` },
        });
      }

      // Overdue — 7 Days Milestone
      else if (diffDays === -7) {
        notifications.push({
          id: `notif_overdue_7d_${inv.id}`,
          category: 'Alerts',
          type: 'OVERDUE_7D',
          severity: 'error', // 🔴 Red
          title: `Payment 7 Days Overdue`,
          message: `#${inv.invoiceNumber} has ₹${remainingBalance.toLocaleString()} outstanding and is 7 days overdue.`,
          timestamp: today,
          read: false,
          action: { label: 'View Invoice', route: `/invoices/${inv.id}` },
        });
      }

      // Overdue — 14 Days Milestone
      else if (diffDays === -14) {
        notifications.push({
          id: `notif_overdue_14d_${inv.id}`,
          category: 'Alerts',
          type: 'OVERDUE_14D',
          severity: 'error', // 🔴 Red
          title: `Payment Seriously Overdue`,
          message: `#${inv.invoiceNumber} has remained unpaid for 14 days. Outstanding: ₹${remainingBalance.toLocaleString()}.`,
          timestamp: today,
          read: false,
          action: { label: 'View Invoice', route: `/invoices/${inv.id}` },
        });
      }

      // Overdue — 30+ Days Milestone
      else if (diffDays <= -30 && Math.abs(diffDays) % 15 === 0) {
        notifications.push({
          id: `notif_overdue_30d_${inv.id}`,
          category: 'Alerts',
          type: 'OVERDUE_30D',
          severity: 'error', // 🔴 Red
          title: `Long-Overdue Payment`,
          message: `#${inv.invoiceNumber} has ₹${remainingBalance.toLocaleString()} outstanding for ${Math.abs(diffDays)} days.`,
          timestamp: today,
          read: false,
          action: { label: 'View Invoice', route: `/invoices/${inv.id}` },
        });
      }
    }
  });

  // 3. Fetch Projects with approaching deadlines in next 3 days
  if (notifyProjectDeadlines) {
    const projects = await prisma.project.findMany({
      where: {
        client: { userId },
        status: { notIn: ['Completed', 'Cancelled'] },
        dueDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
      include: { client: true },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    projects.forEach((proj) => {
      notifications.push({
        id: `notif_proj_${proj.id}`,
        category: 'Alerts',
        type: 'PROJECT_DEADLINE',
        severity: 'info',
        title: `Project Deadline Approaching`,
        message: `Project "${proj.title}" for ${proj.client?.name} is due soon.`,
        timestamp: proj.updatedAt || now,
        read: false,
        action: { label: 'View Project', route: `/projects/${proj.id}` },
      });
    });
  }

  // Sort by timestamp descending
  notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Memory & count cap: max 30 notifications returned
  const cappedNotifications = notifications.slice(0, 30);
  const unreadCount = cappedNotifications.filter((n) => !n.read).length;

  return {
    notifications: cappedNotifications,
    unreadCount,
    totalCount: cappedNotifications.length,
    retentionPolicy: '14 Days / Max 30 Items',
  };
};

module.exports = {
  getNotifications,
};
