import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Grid,
  Typography,
  Card,
  Button,
  IconButton,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Snackbar,
  Alert,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  PeopleOutline as ClientsIcon,
  WorkOutline as ProjectsIcon,
  ReceiptOutlined as InvoicesIcon,
  AttachMoney as RevenueIcon,
  PersonAdd as AddClientIcon,
  CreateNewFolder as AddProjectIcon,
  PostAdd as AddInvoiceIcon,
  Payment as RecordPaymentIcon,
  WarningAmber as AlertIcon,
  CheckCircleOutline as CheckIcon,
  ScheduleOutlined as ClockIcon,
  ArrowForward as ArrowIcon,
  AutoAwesome as SparkIcon,
  StarBorder as StarIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import RevenueChart from '../../components/charts/RevenueChart';
import MiniCalendar from '../../components/calendar/MiniCalendar';

const DashboardPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Snackbar states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Local Mock Bypass
      const token = localStorage.getItem('clientflow-token');
      if (token === 'mock-jwt-token-for-local-testing') {
        const hasSeeded = localStorage.getItem('clientflow-mock-seeded') === 'true';
        setData(hasSeeded ? getPopulatedMockDashboardData() : getEmptyMockDashboardData());
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/dashboard');
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      showSnackbar('Could not load dashboard data from server. Running in mock/offline mode.', 'warning');
      
      // Fallback Mock Data for local testing (so app doesn't break if server is down)
      setData(getEmptyMockDashboardData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };


  // Speed Dial Quick Actions
  const quickActions = [
    { icon: <AddClientIcon />, name: 'Add Client', action: () => navigate('/clients/new') },
    { icon: <AddProjectIcon />, name: 'Create Project', action: () => showSnackbar('Create Project module coming soon!', 'info') },
    { icon: <AddInvoiceIcon />, name: 'Generate Invoice', action: () => showSnackbar('Generate Invoice module coming soon!', 'info') },
    { icon: <RecordPaymentIcon />, name: 'Record Payment', action: () => showSnackbar('Record Payment module coming soon!', 'info') },
  ];

  // Helper to choose greeting based on time
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Format currencies
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in progress':
        return 'primary';
      case 'completed':
      case 'paid':
        return 'success';
      case 'overdue':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Loading skeletons matching actual layout
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Welcome Banner Skeleton */}
        <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 4 }} />
        
        {/* Stats Cards Skeleton */}
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>

        {/* Chart and Calendar Skeleton */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  const { stats, monthlyRevenue, recentClients, aiInsights } = data;
  const upcomingDeadlines = [];
  const recentProjects = [];
  const calendarEvents = (data?.calendarEvents || []).filter(e => e.date !== '2026-09-08' && !e.date?.endsWith('-09-08'));
  if (stats) {
    stats.activeProjects = 0;
    stats.projectsDueThisWeek = 0;
  }
  const isEmpty = stats.totalClients === 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* 3. Welcome Banner */}
      <Card
        sx={{
          p: { xs: 3, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
            : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Box sx={{ relative: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
                {getGreeting()}, {user?.fullName || 'Pratik'} 👋
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Manage your freelance business from one place.
              </Typography>
            </Box>
          </Grid>
          {/* Subtle Work SVG Illustration */}
          <Grid item xs={12} sm={4} sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'flex-end' }}>
            <svg width="150" height="110" viewBox="0 0 150 110" fill="none">
              <rect x="25" y="20" width="100" height="70" rx="6" fill={theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'} />
              <rect x="35" y="30" width="80" height="15" rx="3" fill={theme.palette.mode === 'dark' ? '#475569' : '#CBD5E1'} />
              <rect x="35" y="50" width="50" height="8" rx="2" fill="primary.main" opacity="0.8" />
              <rect x="35" y="62" width="65" height="8" rx="2" fill={theme.palette.mode === 'dark' ? '#475569' : '#CBD5E1'} />
              <circle cx="110" cy="55" r="10" fill="primary.main" opacity="0.2" />
              <path d="M106 55L109 58L114 53" stroke="primary.main" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 90H140" stroke={theme.palette.divider} strokeWidth="3" strokeLinecap="round" />
              <path d="M70 90V105" stroke={theme.palette.mode === 'dark' ? '#475569' : '#CBD5E1'} strokeWidth="3" />
              <path d="M55 105H95" stroke={theme.palette.mode === 'dark' ? '#475569' : '#CBD5E1'} strokeWidth="3" strokeLinecap="round" />
            </svg>
          </Grid>
        </Grid>
      </Card>

      {/* 4. Statistics Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => navigate('/clients')}
            sx={{
              p: 3,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[2],
                borderColor: 'primary.main',
              }
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                Total Clients
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                {stats.totalClients}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {stats.clientsChange}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.05)', color: 'primary.main', width: 48, height: 48 }}>
              <ClientsIcon />
            </Avatar>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => navigate('/projects')}
            sx={{
              p: 3,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[2],
                borderColor: 'primary.main',
              }
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                Active Projects
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                {stats.activeProjects || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {stats.projectsDueThisWeek || 0} due this week
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.05)', color: 'primary.main', width: 48, height: 48 }}>
              <ProjectsIcon />
            </Avatar>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => navigate('/invoices')}
            sx={{
              p: 3,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[2],
                borderColor: 'primary.main',
              }
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                Pending Payments
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                {formatCurrency(stats.pendingPaymentsAmount)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {stats.pendingInvoicesCount} invoices pending
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(217,119,6,0.1)' : 'rgba(217,119,6,0.05)', color: 'warning.main', width: 48, height: 48 }}>
              <InvoicesIcon />
            </Avatar>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => navigate('/invoices')}
            sx={{
              p: 3,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[2],
                borderColor: 'primary.main',
              }
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                Total Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                {formatCurrency(stats.totalRevenue)}
              </Typography>
              <Typography variant="caption" color="success.main" sx={{ display: 'block', fontWeight: 600 }}>
                {stats.revenueChange}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(5,150,105,0.1)' : 'rgba(5,150,105,0.05)', color: 'success.main', width: 48, height: 48 }}>
              <RevenueIcon />
            </Avatar>
          </Card>
        </Grid>
      </Grid>

      {/* 12. Onboarding Empty State */}
      {isEmpty ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'primary.light' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                Welcome to ClientFlow! 🚀
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                Your business control center is ready. Follow these three simple steps to unlock analytics, charts, calendar schedules, and AI insights:
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 420, mx: 'auto', textAlign: 'left', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>1</Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Add your first client to your database.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>2</Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Create your first active project with a budget.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>3</Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Generate your first billing invoice.
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            {/* Onboarding AI insight */}
            <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SparkIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  AI Insights
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 'auto' }}>
                "Welcome to ClientFlow! Add your first client to start tracking billing, generating professional invoices, and viewing business recommendations."
              </Typography>
            </Card>
          </Grid>
        </Grid>
      ) : (
        /* Rich Dashboard Contents (Rendered when clients exist) */
        <>
          {/* 5. Revenue Section & 7. Mini Calendar */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <RevenueChart data={monthlyRevenue} />
            </Grid>
            <Grid item xs={12} lg={4}>
              <MiniCalendar events={calendarEvents} />
            </Grid>
          </Grid>

          {/* 6. Upcoming Deadlines & AI Insights */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
                  Upcoming Deadlines
                </Typography>
                
                {upcomingDeadlines.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No upcoming deadlines scheduled.
                  </Typography>
                ) : (
                  <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {upcomingDeadlines.map((item) => (
                      <ListItem
                        key={item.id}
                        onClick={() => navigate('/projects')}
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(37,99,235,0.04)' : 'rgba(37,99,235,0.02)',
                          },
                          transition: 'all 0.2s'
                        }}
                      >
                        <ListItemText
                          primary={item.title}
                          secondary={item.clientName}
                          primaryTypographyProps={{ fontSize: '0.925rem', fontWeight: 600 }}
                          secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {formatCurrency(item.budget)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <ClockIcon sx={{ fontSize: '0.85rem' }} />
                            <Typography variant="caption">
                              {new Date(item.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Card>
            </Grid>

            {/* 10. AI Insights */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                  <SparkIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    AI Recommendations
                  </Typography>
                </Box>

                {aiInsights.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No recommendations currently available.
                  </Typography>
                ) : (
                  <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {aiInsights.map((insight) => (
                      <ListItem
                        key={insight.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: insight.insightType === 'HIGH_RISK' ? 'error.light' : 'divider',
                          bgcolor: insight.insightType === 'HIGH_RISK' 
                            ? (theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.02)')
                            : 'transparent'
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32, color: insight.insightType === 'HIGH_RISK' ? 'error.main' : 'primary.main' }}>
                          <AlertIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={insight.message}
                          secondary={`For client: ${insight.clientName}`}
                          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                          secondaryTypographyProps={{ fontSize: '0.725rem', color: 'text.secondary', sx: { mt: 0.5 } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Card>
            </Grid>
          </Grid>

          {/* 8. Recent Clients & 9. Recent Projects */}
          <Grid container spacing={3}>
            {/* Recent Clients */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, minHeight: 240 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Recent Clients
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowIcon fontSize="small" />}
                    onClick={() => navigate('/clients')}
                  >
                    View All
                  </Button>
                </Box>

                <TableContainer>
                  <Table size="small" aria-label="recent clients table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, pl: 0 }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, pr: 0 }} align="right">Last Project</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentClients.map((client) => (
                        <TableRow key={client.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 500, pl: 0 }}>
                            {client.name}
                          </TableCell>
                          <TableCell>{client.company}</TableCell>
                          <TableCell>
                            <Chip
                              label={client.status}
                              size="small"
                              color={getStatusColor(client.status)}
                              variant="soft"
                              sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ pr: 0 }}>{client.lastProject || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>

            {/* Recent Projects */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, minHeight: 240 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Recent Projects
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowIcon fontSize="small" />}
                    onClick={() => navigate('/projects')}
                  >
                    View All
                  </Button>
                </Box>

                {(!recentProjects || recentProjects.length === 0) ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 4, textAlign: 'center' }}>
                    No projects created yet.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {recentProjects.map((project) => (
                      <Grid item xs={12} sm={6} key={project.id}>
                        <Card
                          onClick={() => navigate('/projects')}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
                            '&:hover': {
                              borderColor: 'primary.main',
                              boxShadow: theme.shadows[1],
                            },
                            transition: 'all 0.15s'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, noWrap: true }}>
                              {project.title}
                            </Typography>
                            <Chip
                              label={project.status}
                              size="small"
                              color={getStatusColor(project.status)}
                              sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Client: {project.clientName}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {formatCurrency(project.budget)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Due {new Date(project.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* 11. Quick Actions Floating Speed Dial */}
      <SpeedDial
        ariaLabel="Dashboard Quick Actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
      >
        {quickActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>

      {/* Snackbar notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2.5 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Fallback Mock Data Builder in case the API is inaccessible
const getEmptyMockDashboardData = () => ({
  stats: {
    totalClients: 0,
    clientsChange: 'No new clients this month',
    activeProjects: 0,
    projectsDueThisWeek: 0,
    pendingPaymentsAmount: 0,
    pendingInvoicesCount: 0,
    totalRevenue: 0,
    revenueChange: '0%'
  },
  monthlyRevenue: [
    { month: 'Feb', year: 2026, amount: 0 },
    { month: 'Mar', year: 2026, amount: 0 },
    { month: 'Apr', year: 2026, amount: 0 },
    { month: 'May', year: 2026, amount: 0 },
    { month: 'Jun', year: 2026, amount: 0 },
    { month: 'Jul', year: 2026, amount: 0 }
  ],
  upcomingDeadlines: [],
  recentClients: [],
  recentProjects: [],
  calendarEvents: [],
  aiInsights: [
    {
      id: 'welcome-1',
      insightType: 'ONBOARDING',
      message: 'Welcome to ClientFlow! Add your first client to start tracking projects, generating professional invoices, and viewing business recommendations.',
      clientName: 'ClientFlow Support',
      createdAt: new Date()
    }
  ]
});

const getPopulatedMockDashboardData = () => {
  const today = new Date();
  
  const formattedDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString();
  };

  return {
    stats: {
      totalClients: 32,
      clientsChange: '+3 this month',
      activeProjects: 0,
      projectsDueThisWeek: 0,
      pendingPaymentsAmount: 45000,
      pendingInvoicesCount: 3,
      totalRevenue: 245000,
      revenueChange: '+12%'
    },
    monthlyRevenue: [
      { month: 'Feb', year: 2026, amount: 25000 },
      { month: 'Mar', year: 2026, amount: 48000 },
      { month: 'Apr', year: 2026, amount: 35000 },
      { month: 'May', year: 2026, amount: 55000 },
      { month: 'Jun', year: 2026, amount: 42000 },
      { month: 'Jul', year: 2026, amount: 40000 }
    ],
    upcomingDeadlines: [],
    recentClients: [
      { id: 1, name: 'Acme Corporation', email: 'billing@acme.com', company: 'Acme Corp', status: 'In Progress', lastProject: '-' },
      { id: 2, name: 'Wayne Enterprises', email: 'finance@waynecorp.com', company: 'Wayne Ent.', status: 'In Progress', lastProject: '-' },
      { id: 3, name: 'Stark Industries', email: 'pepper@stark.com', company: 'Stark Ind.', status: 'Proposal', lastProject: '-' }
    ],
    recentProjects: [],
    calendarEvents: [],
    aiInsights: [
      { id: 1, insightType: 'HIGH_RISK', message: 'Invoice #INV-2026-004 for Acme Corporation is 10 days overdue (₹20,000). Consider sending a friendly reminder.', clientName: 'Acme Corporation' }
    ]
  };
};

export default DashboardPage;
