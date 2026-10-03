const prisma = require('../config/db');

/**
 * Generate real-time explainable business insights for the logged-in freelancer
 */
const getAiInsights = async (userId) => {
  // Fetch user's business data: clients, projects, invoices, payments
  const clients = await prisma.client.findMany({
    where: { userId },
    include: {
      projects: {
        include: {
          invoices: {
            include: {
              payments: true,
            },
          },
        },
      },
    },
  });

  const allInvoices = await prisma.invoice.findMany({
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

  const now = new Date();
  const insights = [];

  // -------------------------------------------------------------
  // Helper calculations
  // -------------------------------------------------------------
  let totalInvoiced = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let overdueCount = 0;
  let unpaidCount = 0;

  const clientStatsMap = new Map();

  allInvoices.forEach((inv) => {
    const paidSum = inv.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const remaining = Math.max(0, inv.amount - paidSum);
    const isPastDue = new Date(inv.dueDate) < now;

    totalInvoiced += inv.amount;
    totalCollected += paidSum;

    if (remaining > 0) {
      unpaidCount++;
      totalOutstanding += remaining;
      if (isPastDue) {
        overdueCount++;
        totalOverdue += remaining;
      }
    }

    // Per client analytics
    const clientId = inv.project.clientId;
    const clientName = inv.project.client.name || inv.project.client.company || 'Client';
    
    if (!clientStatsMap.has(clientId)) {
      clientStatsMap.set(clientId, {
        clientId,
        clientName,
        totalRevenue: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        delays: [],
        overdueInvoices: [],
      });
    }

    const stats = clientStatsMap.get(clientId);
    stats.totalRevenue += paidSum;
    stats.totalInvoices++;

    if (remaining === 0 && paidSum > 0 && inv.payments.length > 0) {
      stats.paidInvoices++;
      // Payment delay = first payment date - due date
      const firstPayment = inv.payments[inv.payments.length - 1]; // oldest payment
      const delayDays = Math.round((new Date(firstPayment.paymentDate) - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
      stats.delays.push(delayDays);
    }

    if (remaining > 0 && isPastDue) {
      stats.overdueInvoices.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        remaining,
        daysOverdue: Math.round((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24)),
      });
    }
  });

  // -------------------------------------------------------------
  // Rule 1: 🔴 Overdue Payment Alerts
  // -------------------------------------------------------------
  allInvoices.forEach((inv) => {
    const paidSum = inv.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const remaining = Math.max(0, inv.amount - paidSum);
    const dueDate = new Date(inv.dueDate);

    if (remaining > 0 && dueDate < now) {
      const daysOverdue = Math.round((now - dueDate) / (1000 * 60 * 60 * 24));
      const clientName = inv.project.client.name || inv.project.client.company;
      const clientStats = clientStatsMap.get(inv.project.clientId);
      const avgDelay = clientStats && clientStats.delays.length > 0
        ? Math.round(clientStats.delays.reduce((a, b) => a + b, 0) / clientStats.delays.length)
        : 0;

      insights.push({
        id: `overdue_${inv.id}`,
        type: 'PAYMENT_RISK_OVERDUE',
        category: 'Payment Risk',
        severity: 'high', // 🔴 Red
        title: `Overdue Invoice ${inv.invoiceNumber}`,
        summary: `${clientName} has ₹${remaining.toLocaleString()} outstanding on ${inv.invoiceNumber} which is ${daysOverdue} days overdue.`,
        why: [
          `Invoice ${inv.invoiceNumber} was due on ${dueDate.toLocaleDateString('en-IN')}`,
          `Outstanding amount: ₹${remaining.toLocaleString()} out of ₹${inv.amount.toLocaleString()} total`,
          avgDelay > 0 ? `Client's historical average payment delay: ${avgDelay} days` : `Invoice is past due without payment`,
        ],
        suggestedAction: 'Send a polite payment reminder or record incoming payment.',
        actions: [
          { label: 'View Invoice', route: `/invoices/${inv.id}` },
          { label: 'Record Payment', action: 'RECORD_PAYMENT', invoiceId: inv.id },
        ],
        createdAt: inv.updatedAt,
      });
    }
  });

  // -------------------------------------------------------------
  // Rule 2: 🟠 Outstanding Balance Summary
  // -------------------------------------------------------------
  if (totalOutstanding > 0) {
    insights.push({
      id: 'outstanding_summary',
      type: 'OUTSTANDING_BALANCE_SUMMARY',
      category: 'Financial Health',
      severity: 'medium', // 🟠 Orange
      title: 'Outstanding Invoice Balance',
      summary: `₹${totalOutstanding.toLocaleString()} in recorded invoice value remains unpaid across ${unpaidCount} invoice${unpaidCount > 1 ? 's' : ''}.`,
      why: [
        `${unpaidCount} invoice${unpaidCount > 1 ? 's are' : ' is'} currently pending payment`,
        `${overdueCount} of these invoice${overdueCount !== 1 ? 's are' : ' is'} overdue for a total of ₹${totalOverdue.toLocaleString()}`,
      ],
      suggestedAction: 'Review pending invoices and prompt clients approaching payment deadlines.',
      actions: [{ label: 'View Payments Ledger', route: '/payments' }],
      createdAt: new Date(),
    });
  }

  // -------------------------------------------------------------
  // Rule 3: 🟡 Client Payment Behavior / Delay Patterns
  // -------------------------------------------------------------
  clientStatsMap.forEach((stats) => {
    if (stats.delays.length >= 1) {
      const avgDelay = Math.round(stats.delays.reduce((a, b) => a + b, 0) / stats.delays.length);
      if (avgDelay > 3) {
        insights.push({
          id: `pattern_client_${stats.clientId}`,
          type: 'CLIENT_PAYMENT_PATTERN',
          category: 'Client Behavior',
          severity: 'warning', // 🟡 Yellow
          title: `Payment Pattern: ${stats.clientName}`,
          summary: `${stats.clientName} typically pays ${avgDelay} days after the invoice due date.`,
          why: [
            `Analyzed across ${stats.paidInvoices} completed payment cycles`,
            `Average delay beyond agreed due date: ${avgDelay} days`,
          ],
          suggestedAction: 'Consider setting shorter payment terms or scheduling early reminders for future invoices.',
          actions: [{ label: 'View Client Profile', route: `/clients/${stats.clientId}` }],
          createdAt: new Date(),
        });
      }
    }
  });

  // -------------------------------------------------------------
  // Rule 4: 🟢 High-Value Client Identification
  // -------------------------------------------------------------
  clientStatsMap.forEach((stats) => {
    if (stats.totalRevenue >= 30000 || (totalCollected > 0 && (stats.totalRevenue / totalCollected) >= 0.25)) {
      const percentage = totalCollected > 0 ? Math.round((stats.totalRevenue / totalCollected) * 100) : 100;
      insights.push({
        id: `high_value_${stats.clientId}`,
        type: 'HIGH_VALUE_CLIENT',
        category: 'Revenue Growth',
        severity: 'success', // 🟢 Green
        title: `High-Value Client: ${stats.clientName}`,
        summary: `${stats.clientName} has generated ₹${stats.totalRevenue.toLocaleString()} in recorded revenue (${percentage}% of total earned).`,
        why: [
          `Total revenue generated: ₹${stats.totalRevenue.toLocaleString()}`,
          `Represents ${percentage}% of your overall collected earnings`,
          `${stats.totalInvoices} invoice(s) billed to date`,
        ],
        suggestedAction: 'Prioritize repeat work, long-term retainers, and premium service offerings for this client.',
        actions: [{ label: 'View Client Details', route: `/clients/${stats.clientId}` }],
        createdAt: new Date(),
      });
    }
  });

  // -------------------------------------------------------------
  // Rule 5: 📈 Revenue Growth Trend Analysis
  // -------------------------------------------------------------
  const monthlyRevenue = {};
  allInvoices.forEach((inv) => {
    inv.payments.forEach((p) => {
      const monthKey = new Date(p.paymentDate).toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + p.amountPaid;
    });
  });

  const monthKeys = Object.keys(monthlyRevenue);
  if (monthKeys.length >= 2) {
    const recentMonths = monthKeys.slice(-3);
    const monthDetails = recentMonths.map((m) => `${m}: ₹${monthlyRevenue[m].toLocaleString()}`).join(', ');
    insights.push({
      id: 'revenue_trend',
      type: 'REVENUE_TREND',
      category: 'Business Analytics',
      severity: 'info',
      title: 'Revenue Trajectory',
      summary: 'Your recorded payments reflect active monthly income flow.',
      why: [`Recent monthly revenue records: ${monthDetails}`],
      suggestedAction: 'Maintain steady invoice generation to sustain your monthly revenue target.',
      actions: [{ label: 'View Financial Ledger', route: '/payments' }],
      createdAt: new Date(),
    });
  }

  // -------------------------------------------------------------
  // Rule 6: 💡 Advance Payment Recommendation
  // -------------------------------------------------------------
  const allProjects = await prisma.project.findMany({
    where: { client: { userId } },
    include: { client: true, invoices: { include: { payments: true } } },
  });

  allProjects.forEach((proj) => {
    const clientStats = clientStatsMap.get(proj.clientId);
    const hasDelayHistory = clientStats && clientStats.delays.some((d) => d > 5);
    const isHighValueProject = proj.budget >= 40000;

    if ((hasDelayHistory || isHighValueProject) && proj.status !== 'Completed') {
      insights.push({
        id: `advance_rec_${proj.id}`,
        type: 'ADVANCE_PAYMENT_RECOMMENDATION',
        category: 'Smart Recommendation',
        severity: 'recommendation', // 💡 Light Blue / Purple
        title: `Advance Payment Suggestion: ${proj.title}`,
        summary: `Consider requesting a 30%–50% advance deposit for project "${proj.title}" (Budget: ₹${proj.budget.toLocaleString()}).`,
        why: [
          `Project budget is ₹${proj.budget.toLocaleString()}`,
          hasDelayHistory
            ? `Client ${proj.client.name} has recorded payment delays on past invoices`
            : `High project value warrants risk mitigation before starting deliverables`,
        ],
        suggestedAction: 'Create an upfront deposit invoice prior to proceeding with major milestones.',
        actions: [{ label: 'Create Deposit Invoice', route: `/invoices?new=true&projectId=${proj.id}` }],
        createdAt: proj.createdAt,
      });
    }
  });

  // -------------------------------------------------------------
  // Rule 7: 💡 Revision Charge Suggestion
  // -------------------------------------------------------------
  allProjects.forEach((proj) => {
    const included = proj.includedRevisions ?? 2;
    const actual = proj.actualRevisions ?? 0;
    if (actual > included) {
      insights.push({
        id: `revision_rec_${proj.id}`,
        type: 'REVISION_CHARGE_RECOMMENDATION',
        category: 'Smart Recommendation',
        severity: 'recommendation',
        title: `Revision Threshold Exceeded: ${proj.title}`,
        summary: `Project "${proj.title}" has recorded ${actual} revisions, exceeding the agreed included count of ${included}.`,
        why: [
          `Agreed included revisions: ${included}`,
          `Actual revisions delivered: ${actual}`,
          `Extra revisions delivered: ${actual - included}`,
        ],
        suggestedAction: 'Draft an additional scope invoice for the extra revision iterations.',
        actions: [{ label: 'Bill Additional Revisions', route: `/invoices?new=true&projectId=${proj.id}` }],
        createdAt: new Date(),
      });
    }
  });

  // -------------------------------------------------------------
  // Rule 8: 📊 Business Financial Health Summary
  // -------------------------------------------------------------
  if (totalInvoiced > 0) {
    const collectionRate = Math.round((totalCollected / totalInvoiced) * 100);
    insights.push({
      id: 'business_health_summary',
      type: 'BUSINESS_HEALTH_SUMMARY',
      category: 'Overall Health',
      severity: collectionRate >= 80 ? 'success' : collectionRate >= 60 ? 'warning' : 'high',
      title: 'Business Collection Rate',
      summary: `Your overall invoice collection rate is currently ${collectionRate}%.`,
      why: [
        `Total Billed: ₹${totalInvoiced.toLocaleString()}`,
        `Total Received: ₹${totalCollected.toLocaleString()}`,
        `Total Pending: ₹${totalOutstanding.toLocaleString()}`,
      ],
      suggestedAction: collectionRate >= 80
        ? 'Excellent financial health! Keep up timely billing.'
        : 'Follow up on pending invoices to boost overall collection efficiency.',
      actions: [{ label: 'View All Payments', route: '/payments' }],
      createdAt: new Date(),
    });
  }

  return {
    insights,
    summary: {
      totalInsights: insights.length,
      highRiskCount: insights.filter((i) => i.severity === 'high').length,
      warningCount: insights.filter((i) => i.severity === 'medium' || i.severity === 'warning').length,
      growthCount: insights.filter((i) => i.severity === 'success').length,
      recommendationsCount: insights.filter((i) => i.severity === 'recommendation').length,
    },
  };
};

module.exports = {
  getAiInsights,
};
