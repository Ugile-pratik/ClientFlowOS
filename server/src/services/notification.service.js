const prisma = require('../config/db');

/**
 * Generates lightweight, real-time notifications on-the-fly from existing DB tables.
 * Applies a strict 14-day retention filter and caps at 30 items max to preserve memory.
 */
const getNotifications = async (userId) => {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const notifications = [];

  // 1. Fetch Invoices for Overdue & Upcoming invoice alerts
  const invoices = await prisma.invoice.findMany({
    where: {
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
    orderBy: { dueDate: 'asc' },
  });

  invoices.forEach((inv) => {
    const paidSum = inv.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const remaining = Math.max(0, inv.amount - paidSum);
    const dueDate = new Date(inv.dueDate);
    const clientName = inv.project?.client?.name || inv.project?.client?.company || 'Client';

    // 🔴 Overdue Invoice Alert (if unpaid and past due within last 14 days)
    if (remaining > 0 && dueDate < now && dueDate >= fourteenDaysAgo) {
      const daysOverdue = Math.max(1, Math.round((now - dueDate) / (1000 * 60 * 60 * 24)));
      notifications.push({
        id: `notif_overdue_${inv.id}`,
        category: 'Alerts',
        type: 'OVERDUE_INVOICE',
        severity: 'error', // 🔴 Red
        title: `Overdue Invoice #${inv.invoiceNumber}`,
        message: `${clientName} has ₹${remaining.toLocaleString()} outstanding on ${inv.invoiceNumber} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue).`,
        timestamp: dueDate,
        read: false,
        action: { label: 'View Invoice', route: `/invoices/${inv.id}` },
      });
    }

    // ⏰ Upcoming Invoice Due Alert (if unpaid and due within next 3 days)
    if (remaining > 0 && dueDate >= now && dueDate <= threeDaysFromNow) {
      const daysLeft = Math.round((dueDate - now) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `notif_upcoming_${inv.id}`,
        category: 'Alerts',
        type: 'UPCOMING_DUE',
        severity: 'warning', // 🟠 Orange
        title: `Invoice Due Soon: #${inv.invoiceNumber}`,
        message: `Invoice #${inv.invoiceNumber} (₹${remaining.toLocaleString()}) is due ${daysLeft === 0 ? 'today' : `in ${daysLeft} day(s)`}.`,
        timestamp: inv.createdAt,
        read: false,
        action: { label: 'View Invoice', route: `/invoices/${inv.id}` },
      });
    }
  });

  // 2. Fetch Projects with approaching deadlines in next 3 days
  const projects = await prisma.project.findMany({
    where: {
      client: { userId },
      status: { not: 'Completed' },
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
