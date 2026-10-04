const prisma = require('../config/db');

/**
 * Generate real-time explainable business insights for the logged-in freelancer.
 * Phase 1 Rule-Based AI Engine:
 * - Bulletproof null safety across all models (Clients, Projects, Invoices, Payments)
 * - Safe mathematical calculations (guarded against division by zero)
 * - Strict Data Sufficiency rules (>= 3 invoices for behavior, >= 2 for high-value)
 * - Milestone-based payment risk severity (1d, 7d, 14d, 30d)
 * - MoM Revenue trend & portfolio concentration alerts
 * - Actionable recommendations (Advance payment, scope creep revision threshold)
 */
const getAiInsights = async (userId) => {
  try {
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
          orderBy: { paymentDate: 'desc' }, // Latest payment first (index 0)
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const insights = [];

    // -------------------------------------------------------------
    // Data Aggregation & Financial Metrics
    // -------------------------------------------------------------
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;
    let unpaidCount = 0;

    const clientStatsMap = new Map();

    allInvoices.forEach((inv) => {
      if (!inv || !inv.project) return; // Null safety guard

      const payments = Array.isArray(inv.payments) ? inv.payments : [];
      const paidSum = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
      const invAmount = Number(inv.amount) || 0;
      const remaining = Math.max(0, invAmount - paidSum);
      const invDueDate = inv.dueDate ? new Date(inv.dueDate) : today;
      const isPastDue = invDueDate < today;

      totalInvoiced += invAmount;
      totalCollected += paidSum;

      if (remaining > 0) {
        unpaidCount++;
        totalOutstanding += remaining;
        if (isPastDue) {
          overdueCount++;
          totalOverdue += remaining;
        }
      }

      // Client Level Aggregation
      const clientId = inv.project.clientId;
      if (!clientId) return;

      const clientObj = inv.project.client;
      const clientName = clientObj?.name || clientObj?.company || 'Client';

      if (!clientStatsMap.has(clientId)) {
        clientStatsMap.set(clientId, {
          clientId,
          clientName,
          totalRevenue: 0,
          totalOutstanding: 0,
          totalInvoices: 0,
          paidInvoices: 0,
          onTimeCount: 0,
          lateCount: 0,
          delays: [],
        });
      }

      const stats = clientStatsMap.get(clientId);
      stats.totalRevenue += paidSum;
      stats.totalOutstanding += remaining;
      stats.totalInvoices++;

      // Full Payment Delay Calculation (calculated on payment date when remaining balance reached 0)
      if (remaining === 0 && paidSum > 0 && payments.length > 0) {
        stats.paidInvoices++;
        const fullPaymentDate = payments[0].paymentDate ? new Date(payments[0].paymentDate) : today;
        const delayDays = Math.round((fullPaymentDate - invDueDate) / (1000 * 60 * 60 * 24));

        if (delayDays <= 0) {
          stats.onTimeCount++;
          stats.delays.push(0);
        } else {
          stats.lateCount++;
          stats.delays.push(delayDays);
        }
      }
    });

    // -------------------------------------------------------------
    // 1. PAYMENT RISK ENGINE (1 / 7 / 14 / 30+ Overdue Days)
    // -------------------------------------------------------------
    allInvoices.forEach((inv) => {
      if (!inv || !inv.project || !inv.invoiceNumber) return;

      const payments = Array.isArray(inv.payments) ? inv.payments : [];
      const paidSum = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
      const invAmount = Number(inv.amount) || 0;
      const remaining = Math.max(0, invAmount - paidSum);
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : today;

      // Lifecycle Guard: Only generate risk insight if invoice is unpaid & past due
      if (remaining > 0 && dueDate < today) {
        const daysOverdue = Math.round((today - dueDate) / (1000 * 60 * 60 * 24));
        const clientObj = inv.project.client;
        const clientName = clientObj?.name || clientObj?.company || 'Client';
        const clientStats = clientStatsMap.get(inv.project.clientId);
        
        const avgDelay = clientStats && clientStats.delays.length > 0
          ? Math.round(clientStats.delays.reduce((a, b) => a + b, 0) / clientStats.delays.length)
          : 0;

        let severity = 'high'; // 🔴 Payment Risk (1-6 days overdue)
        let riskTitle = `Payment Overdue Risk: ${inv.invoiceNumber}`;
        let riskMessage = `Invoice #${inv.invoiceNumber} is ${daysOverdue} day(s) overdue (₹${remaining.toLocaleString()} outstanding).`;

        if (daysOverdue >= 30) {
          severity = 'critical'; // 🔴 Critical Risk (30+ Days)
          riskTitle = `30+ Day Capital Risk: ${inv.invoiceNumber}`;
          riskMessage = `Invoice #${inv.invoiceNumber} has ₹${remaining.toLocaleString()} outstanding for over 30 days (${daysOverdue} days).`;
        } else if (daysOverdue >= 14) {
          severity = 'critical'; // 🔴 Critical Risk (14-29 Days)
          riskTitle = `Serious Overdue Risk: ${inv.invoiceNumber}`;
          riskMessage = `Invoice #${inv.invoiceNumber} has remained unpaid for ${daysOverdue} days (₹${remaining.toLocaleString()} outstanding).`;
        } else if (daysOverdue >= 7) {
          severity = 'high'; // 🔴 High Risk (7-13 Days)
          riskTitle = `7-Day Overdue Warning: ${inv.invoiceNumber}`;
          riskMessage = `Invoice #${inv.invoiceNumber} is ${daysOverdue} days past due date.`;
        }

        insights.push({
          id: `PAYMENT_RISK:${inv.invoiceNumber}`,
          type: 'PAYMENT_RISK',
          category: 'Payment Risk',
          severity,
          title: riskTitle,
          summary: riskMessage,
          why: [
            `Invoice #${inv.invoiceNumber} was due on ${dueDate.toLocaleDateString('en-IN')}`,
            `Remaining balance: ₹${remaining.toLocaleString()} out of ₹${invAmount.toLocaleString()}`,
            avgDelay > 0 ? `Client average historical payment delay: ${avgDelay} days` : `No completed payment history for client`,
          ],
          suggestedAction: daysOverdue >= 14
            ? 'Send a formal written notice and request advance deposits for future work.'
            : 'Send a polite reminder email to the client.',
          actions: [
            { label: 'View Invoice', route: `/invoices/${inv.id}`, invoiceId: inv.id },
            { label: 'Record Payment', action: 'RECORD_PAYMENT', invoiceId: inv.id },
          ],
          createdAt: inv.updatedAt || now,
        });
      }
    });

    // -------------------------------------------------------------
    // 2. PAYMENT BEHAVIOR (Data Sufficiency Guard >= 3 Invoices)
    // -------------------------------------------------------------
    clientStatsMap.forEach((stats) => {
      if (stats.paidInvoices >= 3 && stats.delays.length > 0) {
        const totalDelaySum = stats.delays.reduce((a, b) => a + b, 0);
        const avgDelay = Math.round(totalDelaySum / stats.delays.length);
        const onTimePct = Math.round((stats.onTimeCount / stats.paidInvoices) * 100);
        const latePct = Math.round((stats.lateCount / stats.paidInvoices) * 100);

        if (avgDelay > 2 || latePct >= 40) {
          insights.push({
            id: `PAYMENT_BEHAVIOR:${stats.clientId}`,
            type: 'CLIENT_PAYMENT_PATTERN',
            category: 'Client Behavior',
            severity: latePct >= 60 ? 'high' : 'medium',
            title: `Payment Behavior Pattern: ${stats.clientName}`,
            summary: `${stats.clientName} pays late ${latePct}% of the time with an average delay of ${avgDelay} days.`,
            why: [
              `Analyzed across ${stats.paidInvoices} fully paid invoice(s)`,
              `On-Time Payments: ${onTimePct}% (${stats.onTimeCount}/${stats.paidInvoices})`,
              `Late Payments: ${latePct}% (${stats.lateCount}/${stats.paidInvoices})`,
              `Average delay past due date: ${avgDelay} days`,
            ],
            suggestedAction: 'Consider setting shorter payment terms (e.g. Net 7) or requiring upfront deposits.',
            actions: [{ label: 'View Client Profile', route: `/clients/${stats.clientId}` }],
            createdAt: now,
          });
        }
      }
    });

    // -------------------------------------------------------------
    // 3. HIGH-VALUE CLIENT (Data Sufficiency Guard >= 2 Invoices)
    // -------------------------------------------------------------
    clientStatsMap.forEach((stats) => {
      if (stats.totalInvoices >= 2) {
        const contributionPct = totalCollected > 0 ? Math.round((stats.totalRevenue / totalCollected) * 100) : 100;
        if (stats.totalRevenue >= 30000 || contributionPct >= 25) {
          insights.push({
            id: `HIGH_VALUE:${stats.clientId}`,
            type: 'HIGH_VALUE_CLIENT',
            category: 'Revenue Growth',
            severity: 'success', // 🟢 Success / High-Value
            title: `High-Value Client: ${stats.clientName}`,
            summary: `${stats.clientName} has contributed ₹${stats.totalRevenue.toLocaleString()} (${contributionPct}% of total collected revenue).`,
            why: [
              `Total Revenue Billed & Paid: ₹${stats.totalRevenue.toLocaleString()}`,
              `Revenue Contribution: ${contributionPct}% of total business earnings`,
              `${stats.totalInvoices} invoice(s) completed to date`,
            ],
            suggestedAction: 'Prioritize repeat retainer agreements and dedicated support for this client.',
            actions: [{ label: 'View Client Profile', route: `/clients/${stats.clientId}` }],
            createdAt: now,
          });
        }
      }
    });

    // -------------------------------------------------------------
    // 4. REVENUE TREND (Current vs Previous Month)
    // -------------------------------------------------------------
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();

    const prevMonth = nowMonth === 0 ? 11 : nowMonth - 1;
    const prevYear = nowMonth === 0 ? nowYear - 1 : nowYear;

    let currentMonthRevenue = 0;
    let prevMonthRevenue = 0;

    allInvoices.forEach((inv) => {
      const payments = Array.isArray(inv.payments) ? inv.payments : [];
      payments.forEach((p) => {
        if (!p || !p.paymentDate) return;
        const pDate = new Date(p.paymentDate);
        const amount = Number(p.amountPaid) || 0;
        if (pDate.getMonth() === nowMonth && pDate.getFullYear() === nowYear) {
          currentMonthRevenue += amount;
        } else if (pDate.getMonth() === prevMonth && pDate.getFullYear() === prevYear) {
          prevMonthRevenue += amount;
        }
      });
    });

    if (currentMonthRevenue > 0 || prevMonthRevenue > 0) {
      let growthPct = 0;
      if (prevMonthRevenue > 0) {
        growthPct = Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100);
      }

      const currentMonthLabel = now.toLocaleString('default', { month: 'short' });
      const prevMonthLabel = new Date(prevYear, prevMonth, 1).toLocaleString('default', { month: 'short' });

      insights.push({
        id: `REVENUE_TREND:${nowYear}-${nowMonth + 1}`,
        type: 'REVENUE_TREND',
        category: 'Business Analytics',
        severity: growthPct >= 0 ? 'low' : 'medium',
        title: `Revenue Trend (${currentMonthLabel} vs ${prevMonthLabel})`,
        summary: growthPct >= 0
          ? `Revenue is up ${growthPct}% this month (₹${currentMonthRevenue.toLocaleString()} vs ₹${prevMonthRevenue.toLocaleString()}).`
          : `Revenue is down ${Math.abs(growthPct)}% compared to last month (₹${currentMonthRevenue.toLocaleString()} vs ₹${prevMonthRevenue.toLocaleString()}).`,
        why: [
          `${currentMonthLabel} Recorded Revenue: ₹${currentMonthRevenue.toLocaleString()}`,
          `${prevMonthLabel} Recorded Revenue: ₹${prevMonthRevenue.toLocaleString()}`,
          `MoM Change: ${growthPct >= 0 ? '+' : ''}${growthPct}%`,
        ],
        suggestedAction: growthPct >= 0
          ? 'Great momentum! Continue following up on active proposals.'
          : 'Focus on collecting pending invoices and sending new project quotes.',
        actions: [{ label: 'View Payments Ledger', route: '/payments' }],
        createdAt: now,
      });
    }

    // -------------------------------------------------------------
    // 5. REVENUE CONCENTRATION RISK (>= 50% from 1 client)
    // -------------------------------------------------------------
    if (totalCollected > 0 && clientStatsMap.size > 1) {
      clientStatsMap.forEach((stats) => {
        const sharePct = Math.round((stats.totalRevenue / totalCollected) * 100);
        if (sharePct >= 50) {
          insights.push({
            id: `REVENUE_CONCENTRATION:${stats.clientId}`,
            type: 'REVENUE_CONCENTRATION',
            category: 'Business Risk',
            severity: 'medium', // 🟡 Warning
            title: `Revenue Concentration Risk: ${stats.clientName}`,
            summary: `${stats.clientName} represents ${sharePct}% of your total collected income.`,
            why: [
              `Client Revenue: ₹${stats.totalRevenue.toLocaleString()}`,
              `Total Business Earnings: ₹${totalCollected.toLocaleString()}`,
              `Single Client Share: ${sharePct}%`,
            ],
            suggestedAction: 'Diversify your client portfolio to reduce financial dependency on a single client.',
            actions: [{ label: 'View Client Profile', route: `/clients/${stats.clientId}` }],
            createdAt: now,
          });
        }
      });
    }

    // -------------------------------------------------------------
    // 6. OUTSTANDING CONCENTRATION RISK (>= 50% unpaid money)
    // -------------------------------------------------------------
    if (totalOutstanding > 0 && clientStatsMap.size > 1) {
      clientStatsMap.forEach((stats) => {
        const outstandingSharePct = Math.round((stats.totalOutstanding / totalOutstanding) * 100);
        if (outstandingSharePct >= 50 && stats.totalOutstanding > 0) {
          insights.push({
            id: `OUTSTANDING_CONCENTRATION:${stats.clientId}`,
            type: 'OUTSTANDING_CONCENTRATION',
            category: 'Payment Risk',
            severity: 'high', // 🟠 High Risk
            title: `Outstanding Balance Concentration: ${stats.clientName}`,
            summary: `${stats.clientName} accounts for ${outstandingSharePct}% of all unpaid portfolio balance (₹${stats.totalOutstanding.toLocaleString()}).`,
            why: [
              `Client Unpaid Balance: ₹${stats.totalOutstanding.toLocaleString()}`,
              `Total Portfolio Unpaid: ₹${totalOutstanding.toLocaleString()}`,
              `Unpaid Concentration Share: ${outstandingSharePct}%`,
            ],
            suggestedAction: 'Focus immediate collection efforts on this client to clear the bulk of outstanding cash flow.',
            actions: [{ label: 'View Invoices', route: `/invoices` }],
            createdAt: now,
          });
        }
      });
    }

    // -------------------------------------------------------------
    // 7. RECOMMENDATIONS (Multi-Factor Advance & Revision Limits)
    // -------------------------------------------------------------
    const allProjects = await prisma.project.findMany({
      where: { client: { userId } },
      include: { client: true, invoices: { include: { payments: true } } },
    });

    allProjects.forEach((proj) => {
      if (!proj) return;

      const clientStats = clientStatsMap.get(proj.clientId);
      const hasDelayHistory = clientStats && clientStats.delays.some((d) => d > 5);
      const isNewClient = !clientStats || clientStats.totalInvoices < 2;
      const projBudget = Number(proj.budget) || 0;
      const isHighValueProject = projBudget >= 40000;
      const projStatus = proj.status ? String(proj.status) : '';

      // Multi-factor advance payment rule
      if (isHighValueProject && (hasDelayHistory || isNewClient) && !['Completed', 'Cancelled'].includes(projStatus)) {
        const clientName = proj.client?.name || proj.client?.company || 'Client';
        insights.push({
          id: `ADVANCE_REC:${proj.id}`,
          type: 'ADVANCE_PAYMENT_RECOMMENDATION',
          category: 'Smart Recommendation',
          severity: 'recommendation',
          title: `Advance Deposit Recommendation: ${proj.title}`,
          summary: `Consider requesting a 30%–50% advance deposit for project "${proj.title}" (Budget: ₹${projBudget.toLocaleString()}).`,
          why: [
            `Project budget is ₹${projBudget.toLocaleString()}`,
            hasDelayHistory ? `Client ${clientName} has recorded payment delays` : `Client is new with fewer than 2 completed invoices`,
          ],
          suggestedAction: 'Create an upfront deposit invoice prior to delivering project milestones.',
          actions: [{ label: 'Create Invoice', route: `/invoices` }],
          createdAt: proj.createdAt || now,
        });
      }

      // Revision Limit Exceeded Rule
      const included = Number(proj.includedRevisions) ?? 2;
      const actual = Number(proj.actualRevisions) ?? 0;
      if (actual > included) {
        insights.push({
          id: `REVISION_REC:${proj.id}`,
          type: 'REVISION_CHARGE_RECOMMENDATION',
          category: 'Smart Recommendation',
          severity: 'recommendation',
          title: `Revision Limit Exceeded: ${proj.title}`,
          summary: `Project "${proj.title}" has delivered ${actual} revisions, exceeding the limit of ${included}.`,
          why: [
            `Agreed included revisions: ${included}`,
            `Delivered revisions: ${actual}`,
            `Extra revisions delivered: ${actual - included}`,
          ],
          suggestedAction: 'Draft an additional scope invoice for extra revision iterations.',
          actions: [{ label: 'Create Invoice', route: `/invoices` }],
          createdAt: now,
        });
      }
    });

    // -------------------------------------------------------------
    // Sort Insights & Build Compatible Summary Breakdown
    // -------------------------------------------------------------
    const severityWeight = { critical: 4, high: 3, medium: 2, low: 1, success: 1, recommendation: 0 };
    insights.sort((a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0));

    const criticalCount = insights.filter((i) => i.severity === 'critical').length;
    const highCount = insights.filter((i) => i.severity === 'high').length;
    const mediumCount = insights.filter((i) => i.severity === 'medium').length;
    const successCount = insights.filter((i) => i.severity === 'success').length;
    const lowCount = insights.filter((i) => i.severity === 'low').length;
    const recommendationsCount = insights.filter((i) => i.severity === 'recommendation').length;

    return {
      insights,
      summary: {
        totalInsights: insights.length,
        // Backward-compatible fields for dashboard/insights UI cards:
        highRiskCount: criticalCount + highCount,
        criticalCount,
        highCount,
        warningCount: mediumCount,
        growthCount: successCount + lowCount,
        infoCount: lowCount,
        recommendationsCount,
      },
    };
  } catch (error) {
    console.error('getAiInsights error:', error);
    // Return empty fallback array on catastrophic failure so UI never crashes
    return {
      insights: [],
      summary: {
        totalInsights: 0,
        highRiskCount: 0,
        criticalCount: 0,
        highCount: 0,
        warningCount: 0,
        growthCount: 0,
        infoCount: 0,
        recommendationsCount: 0,
      },
    };
  }
};

module.exports = {
  getAiInsights,
};
