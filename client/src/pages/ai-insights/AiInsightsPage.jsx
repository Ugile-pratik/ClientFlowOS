import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Tooltip
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  Warning as RiskIcon,
  ReportProblemOutlined as WarningIcon,
  PsychologyOutlined as PatternIcon,
  TrendingUp as GrowthIcon,
  LightbulbOutlined as RecommendationIcon,
  CheckCircleOutline as SuccessIcon,
  HelpOutline as WhyIcon,
  ArrowForward as ArrowIcon,
  ReceiptOutlined as InvoiceIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import RecordPaymentModal from '../../components/payments/RecordPaymentModal';

const AiInsightsPage = () => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  // Record Payment Modal integration
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ai-insights');
      setInsights(response.data.insights || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
      setError('Failed to load AI Insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleOpenPaymentForInvoice = async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(response.data);
      setRecordModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch invoice for payment modal:', err);
      alert('Could not fetch invoice details.');
    }
  };

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return {
          color: 'error',
          badgeText: severity === 'critical' ? '🔴 Critical Risk' : '🔴 Payment Risk',
          icon: <RiskIcon fontSize="small" />,
          borderColor: 'error.main',
          bgColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 242, 242, 0.8)',
        };
      case 'medium':
      case 'warning':
        return {
          color: 'warning',
          badgeText: '🟠 Warning / Pattern',
          icon: <PatternIcon fontSize="small" />,
          borderColor: 'warning.main',
          bgColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(254, 243, 199, 0.7)',
        };
      case 'success':
      case 'low':
        return {
          color: 'success',
          badgeText: '🟢 High-Value Client',
          icon: <GrowthIcon fontSize="small" />,
          borderColor: 'success.main',
          bgColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(236, 253, 245, 0.8)',
        };
      case 'recommendation':
        return {
          color: 'primary',
          badgeText: '💡 Smart Suggestion',
          icon: <RecommendationIcon fontSize="small" />,
          borderColor: 'primary.main',
          bgColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(239, 246, 255, 0.8)',
        };
      default:
        return {
          color: 'info',
          badgeText: '📊 Business Analytics',
          icon: <AiIcon fontSize="small" />,
          borderColor: 'info.main',
          bgColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(240, 249, 255, 0.8)',
        };
    }
  };

  const filteredInsights = insights.filter((item) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'RISK') {
      return item.category === 'Payment Risk' || item.type === 'PAYMENT_RISK' || item.type === 'SERIOUS_OVERDUE_RISK' || item.severity === 'critical' || item.severity === 'high';
    }
    if (activeTab === 'PATTERN') {
      return (item.category === 'Client Behavior' || item.category === 'Business Risk' || item.type === 'CLIENT_PAYMENT_PATTERN' || item.type === 'REVENUE_CONCENTRATION' || item.type === 'OUTSTANDING_CONCENTRATION' || item.severity === 'warning' || item.severity === 'medium') && item.category !== 'Payment Risk' && item.type !== 'PAYMENT_RISK';
    }
    if (activeTab === 'GROWTH') {
      return item.category === 'Revenue Growth' || item.category === 'Business Analytics' || item.type === 'HIGH_VALUE_CLIENT' || item.type === 'REVENUE_TREND' || item.severity === 'success';
    }
    if (activeTab === 'RECOMMENDATIONS') {
      return item.category === 'Smart Recommendation' || item.type === 'ADVANCE_PAYMENT_RECOMMENDATION' || item.type === 'REVISION_CHARGE_RECOMMENDATION' || item.severity === 'recommendation';
    }
    return true;
  });

  return (
    <Box>
      {/* Header Banner */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'white', display: 'flex' }}>
              <AiIcon />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px', fontSize: { xs: '1.4rem', sm: '1.85rem', md: '2.125rem' } }}>
              AI Business Insights
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
            Rule-based explainable analytics and recommendations generated from your actual invoices, payments, and client history.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AiIcon />}
          onClick={fetchInsights}
          sx={{ borderRadius: 2.5, px: 2.5, py: 1, width: { xs: '100%', sm: 'auto' } }}
        >
          Refresh Insights
        </Button>
      </Box>

      {/* Summary KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              Payment Risk Alerts
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main', mt: 0.5, fontSize: { xs: '1.4rem', sm: '1.85rem', md: '2rem' } }}>
              {summary.highRiskCount || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              Warnings & Patterns
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main', mt: 0.5, fontSize: { xs: '1.4rem', sm: '1.85rem', md: '2rem' } }}>
              {summary.warningCount || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              High-Value Clients
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main', mt: 0.5, fontSize: { xs: '1.4rem', sm: '1.85rem', md: '2rem' } }}>
              {summary.growthCount || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              Smart Recommendations
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5, fontSize: { xs: '1.4rem', sm: '1.85rem', md: '2rem' } }}>
              {summary.recommendationsCount || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Category Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'transparent' }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`All Insights (${insights.length})`} value="ALL" sx={{ fontWeight: 600 }} />
          <Tab label={`🔴 Payment Risk (${summary.highRiskCount || 0})`} value="RISK" sx={{ fontWeight: 600 }} />
          <Tab label={`🟠 Warnings & Patterns (${summary.warningCount || 0})`} value="PATTERN" sx={{ fontWeight: 600 }} />
          <Tab label={`🟢 High-Value Clients (${summary.growthCount || 0})`} value="GROWTH" sx={{ fontWeight: 600 }} />
          <Tab label={`💡 Recommendations (${summary.recommendationsCount || 0})`} value="RECOMMENDATIONS" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Paper>

      {/* Insights Cards Grid */}
      {loading ? (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Analyzing business database & generating insights...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : filteredInsights.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <SuccessIcon sx={{ fontSize: 48, color: 'success.main', mb: 1, opacity: 0.7 }} />
          <Typography variant="h6" color="text.secondary">
            No Active Risk or Insights in this Category
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Your business activity is healthy. Check back when new invoice transactions are recorded.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredInsights.map((insight) => {
            const config = getSeverityConfig(insight.severity);
            return (
              <Grid item xs={12} md={6} key={insight.id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1.5px solid',
                    borderColor: config.borderColor,
                    bgcolor: config.bgColor,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header: Chip Badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip
                        icon={config.icon}
                        label={config.badgeText}
                        color={config.color}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {insight.category}
                      </Typography>
                    </Box>

                    {/* Title & Summary */}
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      {insight.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                      {insight.summary}
                    </Typography>

                    {/* Explainable AI "Why?" Section */}
                    {insight.why && insight.why.length > 0 && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          mb: 2.5,
                          borderRadius: 2.5,
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <WhyIcon color="action" fontSize="small" />
                          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Why this insight? (Trigger Analysis)
                          </Typography>
                        </Box>
                        <Stack spacing={0.75}>
                          {insight.why.map((reason, index) => (
                            <Typography key={index} variant="caption" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, color: 'text.primary' }}>
                              <span style={{ fontWeight: 700, color: 'inherit' }}>•</span>
                              <span>{reason}</span>
                            </Typography>
                          ))}
                        </Stack>
                      </Paper>
                    )}

                    {/* Action Triggers */}
                    <Box sx={{ mt: 'auto', pt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', flex: '1 1 100%', mb: { xs: 0.5, sm: 0 } }}>
                        {insight.suggestedAction}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
                        {insight.actions && insight.actions.map((act, idx) => (
                          <Button
                            key={idx}
                            size="small"
                            variant={idx === 0 ? 'contained' : 'outlined'}
                            color={config.color}
                            onClick={() => {
                              if (act.action === 'RECORD_PAYMENT' && act.invoiceId) {
                                handleOpenPaymentForInvoice(act.invoiceId);
                              } else if (act.route) {
                                navigate(act.route);
                              }
                            }}
                            endIcon={<ArrowIcon fontSize="small" />}
                            sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none', flex: { xs: 1, sm: 'none' } }}
                          >
                            {act.label}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <RecordPaymentModal
          open={recordModalOpen}
          onClose={() => setRecordModalOpen(false)}
          invoice={selectedInvoice}
          onPaymentRecorded={() => {
            fetchInsights();
            setRecordModalOpen(false);
          }}
        />
      )}
    </Box>
  );
};

export default AiInsightsPage;
