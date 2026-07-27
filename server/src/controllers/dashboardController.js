const prisma = require('../config/db');
const { generateInsights } = require('../ai/recommendationEngine');

/**
 * Fetch dashboard overview statistics and sections
 */
const getDashboardData = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get all clients for this user
    const clients = await prisma.client.findMany({
      where: { userId },
    });

    const totalClients = clients.length;

    // Calculate clients added this month
    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    const clientsThisMonth = clients.filter(c => new Date(c.createdAt) >= startOfCurrentMonth).length;

    // 2. Get projects for this user's clients
    const projects = await prisma.project.findMany({
      where: {
        client: { userId }
      },
      include: {
        client: true,
        invoices: {
          include: {
            payments: true
          }
        }
      }
    });

    const activeProjects = projects.filter(p => p.status.toLowerCase() !== 'completed' && p.status.toLowerCase() !== 'cancelled');
    
    // Projects due this week (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const projectsDueThisWeek = activeProjects.filter(p => {
      const dueDate = new Date(p.dueDate);
      return dueDate >= today && dueDate <= nextWeek;
    });

    // 3. Get invoices and payments to calculate revenue & pending amounts
    const invoices = await prisma.invoice.findMany({
      where: {
        project: {
          client: { userId }
        }
      },
      include: {
        project: {
          include: {
            client: true
          }
        },
        payments: true
      }
    });

    // Pending payments: Sum of unpaid amounts for invoices that are pending/overdue
    let pendingPaymentsAmount = 0;
    let pendingInvoicesCount = 0;

    invoices.forEach(inv => {
      if (inv.status.toLowerCase() !== 'paid') {
        pendingInvoicesCount++;
        // Calculate remaining amount on invoice (invoice amount minus sum of payment amounts)
        const totalPaid = inv.payments.reduce((sum, p) => sum + p.amountPaid, 0);
        const remaining = inv.amount - totalPaid;
        pendingPaymentsAmount += remaining > 0 ? remaining : 0;
      }
    });

    // Fetch payments to calculate total revenue & monthly statistics
    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          project: {
            client: { userId }
          }
        }
      },
      include: {
        invoice: {
          include: {
            project: {
              include: {
                client: true
              }
            }
          }
        }
      }
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amountPaid, 0);

    // Calculate monthly revenue changes (This month vs Last month)
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const revenueThisMonth = payments
      .filter(p => new Date(p.paymentDate) >= startOfCurrentMonth)
      .reduce((sum, p) => sum + p.amountPaid, 0);

    const revenueLastMonth = payments
      .filter(p => {
        const pDate = new Date(p.paymentDate);
        return pDate >= startOfLastMonth && pDate <= endOfLastMonth;
      })
      .reduce((sum, p) => sum + p.amountPaid, 0);

    let revenueChange = 0;
    if (revenueLastMonth > 0) {
      revenueChange = Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100);
    } else if (revenueThisMonth > 0) {
      revenueChange = 100; // 100% increase if last month was 0
    }

    // 4. Generate 6-month historical revenue for chart
    const monthlyRevenueData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const mStart = new Date(y, m, 1);
      const mEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
      
      const amt = payments
        .filter(p => {
          const pDate = new Date(p.paymentDate);
          return pDate >= mStart && pDate <= mEnd;
        })
        .reduce((sum, p) => sum + p.amountPaid, 0);
        
      monthlyRevenueData.push({
        month: monthNames[m],
        year: y,
        amount: amt
      });
    }

    // 5. Fetch upcoming deadlines (limit 5)
    const upcomingDeadlines = projects
      .filter(p => p.status.toLowerCase() !== 'completed' && new Date(p.dueDate) >= today)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        dueDate: p.dueDate,
        budget: p.budget,
        clientName: p.client.name
      }));

    // 6. Fetch recent clients (limit 5)
    const recentClients = await prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        projects: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const formattedRecentClients = recentClients.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      company: c.phone || 'N/A', // Using phone as placeholder for company or notes if company is not in schema
      status: c.projects.length > 0 ? c.projects[0].status : 'Inactive',
      lastProject: c.projects.length > 0 ? c.projects[0].title : 'None'
    }));

    // 7. Fetch recent projects (limit 5)
    const recentProjects = projects
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        clientName: p.client.name,
        budget: p.budget,
        dueDate: p.dueDate,
        status: p.status
      }));

    // 8. Generate calendar dates with events
    // Event dates represent project deadlines or invoice payment deadlines
    const calendarEvents = [];
    projects.forEach(p => {
      calendarEvents.push({
        id: `p-${p.id}`,
        title: p.title,
        date: p.dueDate.toISOString().split('T')[0],
        type: 'deadline',
        color: '#E11D48' // rose-600
      });
    });

    invoices.forEach(inv => {
      if (inv.status.toLowerCase() !== 'paid') {
        calendarEvents.push({
          id: `i-${inv.id}`,
          title: `Invoice #${inv.invoiceNumber} Due`,
          date: inv.dueDate.toISOString().split('T')[0],
          type: 'payment',
          color: '#D97706' // amber-600
        });
      }
    });

    payments.forEach(pay => {
      calendarEvents.push({
        id: `pay-${pay.id}`,
        title: `Payment Received`,
        date: pay.paymentDate.toISOString().split('T')[0],
        type: 'received',
        color: '#059669' // emerald-600
      });
    });

    // 9. Generate AI recommendations & insights
    let aiInsights = [];
    
    // Fetch manual/saved insights from DB
    const savedInsights = await prisma.aI_Insight.findMany({
      where: {
        client: { userId }
      },
      include: {
        client: true
      }
    });

    aiInsights = savedInsights.map(insight => ({
      id: insight.id,
      insightType: insight.insightType,
      message: insight.message,
      clientName: insight.client.name,
      createdAt: insight.createdAt
    }));

    // Generate dynamic rule-based insights if there is data
    if (totalClients > 0) {
      // Rule A: Overdue Invoices
      invoices.forEach(inv => {
        const dueDate = new Date(inv.dueDate);
        if (inv.status.toLowerCase() !== 'paid' && dueDate < today) {
          const delayDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
          aiInsights.push({
            id: `dyn-overdue-${inv.id}`,
            insightType: 'HIGH_RISK',
            message: `Invoice #${inv.invoiceNumber} for ${inv.project.client.name} is ${delayDays} days overdue (₹${inv.amount.toLocaleString()}). Send a friendly reminder.`,
            clientName: inv.project.client.name,
            createdAt: new Date()
          });
        }
      });

      // Rule B: Project deadline nearing
      activeProjects.forEach(proj => {
        const dueDate = new Date(proj.dueDate);
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 3) {
          aiInsights.push({
            id: `dyn-deadline-${proj.id}`,
            insightType: 'DEADLINE_NEAR',
            message: `Project "${proj.title}" is due in ${diffDays} days. Ensure milestones are aligned.`,
            clientName: proj.client.name,
            createdAt: new Date()
          });
        }
      });

      // Rule C: Evaluate clients using AI Recommendation Engine
      for (const client of clients) {
        const clientInvoices = invoices.filter(i => i.project.clientId === client.id);
        const unpaidCount = clientInvoices.filter(i => i.status.toLowerCase() !== 'paid').length;
        
        // Calculate average payment delay
        const clientPayments = payments.filter(p => p.invoice.project.clientId === client.id);
        let averageDelay = 0;
        if (clientPayments.length > 0) {
          let totalDelayDays = 0;
          clientPayments.forEach(p => {
            const payDate = new Date(p.paymentDate);
            const dueDate = new Date(p.invoice.dueDate);
            const delay = Math.max(0, Math.ceil((payDate - dueDate) / (1000 * 60 * 60 * 24)));
            totalDelayDays += delay;
          });
          averageDelay = totalDelayDays / clientPayments.length;
        }

        // Mock revision count as 6 if they have lots of unpaid invoices to trigger the mock rule
        const revisionCount = unpaidCount > 2 ? 6 : 2;

        // Is this the highest earning client?
        const clientTotalEarnings = clientPayments.reduce((sum, p) => sum + p.amountPaid, 0);
        let isHighestEarner = false;
        if (clientTotalEarnings > 0) {
          const allClientsEarnings = clients.map(c => {
            const cPays = payments.filter(p => p.invoice.project.clientId === c.id);
            return cPays.reduce((sum, p) => sum + p.amountPaid, 0);
          });
          const maxEarnings = Math.max(...allClientsEarnings);
          isHighestEarner = clientTotalEarnings === maxEarnings;
        }

        const engineInsights = generateInsights({
          averageDelayDays: averageDelay,
          revisionCount,
          unpaidInvoicesCount: unpaidCount,
          isHighestEarner
        });

        engineInsights.forEach((ins, idx) => {
          aiInsights.push({
            id: `dyn-engine-${client.id}-${idx}`,
            insightType: ins.insightType,
            message: ins.message,
            clientName: client.name,
            createdAt: new Date()
          });
        });
      }
    } else {
      // Welcome onboarding insights
      aiInsights.push({
        id: 'dyn-welcome-1',
        insightType: 'ONBOARDING',
        message: 'Welcome to ClientFlow! Add your first client to start tracking projects, generating professional invoices, and viewing business recommendations.',
        clientName: 'ClientFlow Support',
        createdAt: new Date()
      });
    }

    // Deduplicate dynamic insights and slice to limit
    const uniqueInsightsMap = new Map();
    aiInsights.forEach(ins => uniqueInsightsMap.set(ins.message, ins));
    const finalInsights = Array.from(uniqueInsightsMap.values()).slice(0, 5);

    // 10. Combine statistics
    const stats = {
      totalClients,
      clientsChange: clientsThisMonth > 0 ? `+${clientsThisMonth} this month` : 'No new clients this month',
      activeProjects: activeProjects.length,
      projectsDueThisWeek: projectsDueThisWeek.length,
      pendingPaymentsAmount,
      pendingInvoicesCount,
      totalRevenue,
      revenueChange: revenueChange >= 0 ? `+${revenueChange}%` : `${revenueChange}%`
    };

    res.status(200).json({
      stats,
      monthlyRevenue: monthlyRevenueData,
      upcomingDeadlines,
      recentClients: formattedRecentClients,
      recentProjects,
      calendarEvents,
      aiInsights: finalInsights
    });

  } catch (error) {
    console.error('Fetch dashboard data error:', error);
    res.status(500).json({ error: 'Internal server error while fetching dashboard statistics.' });
  }
};

/**
 * Seed sample data for testing the dashboard
 */
const seedDashboardData = async (req, res) => {
  const userId = req.user.id;

  try {
    // Check if user already has clients to avoid double seeding
    const existingClients = await prisma.client.findMany({ where: { userId } });
    if (existingClients.length > 0) {
      return res.status(400).json({ error: 'Seeding cancelled: You already have client data.' });
    }

    // 1. Create Clients
    const client1 = await prisma.client.create({
      data: {
        userId,
        name: 'Acme Corporation',
        email: 'billing@acme.com',
        phone: 'Acme Corp',
        notes: 'Tech startup in San Francisco.'
      }
    });

    const client2 = await prisma.client.create({
      data: {
        userId,
        name: 'Wayne Enterprises',
        email: 'finance@waynecorp.com',
        phone: 'Wayne Ent.',
        notes: 'Multi-industry conglomerate.'
      }
    });

    const client3 = await prisma.client.create({
      data: {
        userId,
        name: 'Stark Industries',
        email: 'pepper@stark.com',
        phone: 'Stark Ind.',
        notes: 'Advanced research and robotics client.'
      }
    });

    // 2. Create Projects
    const today = new Date();
    
    const proj1 = await prisma.project.create({
      data: {
        clientId: client1.id,
        title: 'Website Redesign',
        budget: 45000,
        dueDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        status: 'In Progress'
      }
    });

    const proj2 = await prisma.project.create({
      data: {
        clientId: client2.id,
        title: 'Logo & Brand Design',
        budget: 12000,
        dueDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // Friday or 4 days from now
        status: 'In Progress'
      }
    });

    const proj3 = await prisma.project.create({
      data: {
        clientId: client3.id,
        title: 'Mobile Application Development',
        budget: 185000,
        dueDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days out
        status: 'Proposal'
      }
    });

    const proj4 = await prisma.project.create({
      data: {
        clientId: client1.id,
        title: 'SEO Setup & Audit',
        budget: 8000,
        dueDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        status: 'Completed'
      }
    });

    // 3. Create Invoices
    const inv1 = await prisma.invoice.create({
      data: {
        projectId: proj1.id,
        invoiceNumber: 'INV-2026-001',
        amount: 25000,
        dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: 'Pending'
      }
    });

    const inv2 = await prisma.invoice.create({
      data: {
        projectId: proj2.id,
        invoiceNumber: 'INV-2026-002',
        amount: 8000,
        dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
        status: 'Pending'
      }
    });

    const inv3 = await prisma.invoice.create({
      data: {
        projectId: proj3.id,
        invoiceNumber: 'INV-2026-003',
        amount: 50000,
        dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: 'Pending'
      }
    });

    // Overdue Invoice
    const inv4 = await prisma.invoice.create({
      data: {
        projectId: proj1.id,
        invoiceNumber: 'INV-2026-004',
        amount: 20000,
        dueDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        status: 'Overdue'
      }
    });

    // Paid Invoice
    const inv5 = await prisma.invoice.create({
      data: {
        projectId: proj4.id,
        invoiceNumber: 'INV-2026-005',
        amount: 8000,
        dueDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
        status: 'Paid'
      }
    });

    // 4. Create Payments
    await prisma.payment.create({
      data: {
        invoiceId: inv5.id,
        amountPaid: 8000,
        paymentDate: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Bank Transfer'
      }
    });

    // Let's create historical payments for last 5 months to populate the chart
    for (let i = 1; i <= 5; i++) {
      const pastPaymentDate = new Date();
      pastPaymentDate.setMonth(today.getMonth() - i);
      pastPaymentDate.setDate(15);
      
      // We will map payments to the paid invoice to satisfy schema constraints, or create a mock invoice for each
      const dummyProj = await prisma.project.create({
        data: {
          clientId: client1.id,
          title: `Archived Project Month -${i}`,
          budget: 15000 * i,
          dueDate: pastPaymentDate,
          status: 'Completed'
        }
      });

      const dummyInv = await prisma.invoice.create({
        data: {
          projectId: dummyProj.id,
          invoiceNumber: `INV-HIST-00${i}`,
          amount: 15000 * i,
          dueDate: pastPaymentDate,
          status: 'Paid'
        }
      });

      await prisma.payment.create({
        data: {
          invoiceId: dummyInv.id,
          amountPaid: 12000 * i, // Some paid amount
          paymentDate: pastPaymentDate,
          paymentMethod: 'Credit Card'
        }
      });
    }

    // 5. Create AI Insights
    await prisma.aI_Insight.create({
      data: {
        clientId: client2.id,
        insightType: 'ADVANCE_PAYMENT',
        message: 'Wayne Enterprises payments have delayed twice. Recommend securing a 50% deposit upfront on your next project.'
      }
    });

    res.status(200).json({ message: 'Dashboard seed data populated successfully!' });
  } catch (error) {
    console.error('Seed dashboard data error:', error);
    res.status(500).json({ error: 'Internal server error while seeding data.' });
  }
};

module.exports = {
  getDashboardData,
  seedDashboardData
};
