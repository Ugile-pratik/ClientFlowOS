import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Stack,
  useTheme
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as CompanyIcon,
  Person as ContactIcon,
  LocationOn as AddressIcon,
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendIcon,
  FolderOpen as ProjectIcon,
  Circle as TimelineDot
} from '@mui/icons-material';
import { getClientById } from '../../services/clientService';

const ClientProfilePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  // State Management
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        const data = await getClientById(id);
        setClient(data);
      } catch (err) {
        console.error('Error fetching client details:', err);
        showSnackbar(err.message || 'Failed to load client details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Helper to color-code status badges
  const getStatusDetails = (status) => {
    switch (status ? status.toLowerCase() : '') {
      case 'active':
        return { color: 'success', label: 'Active' };
      case 'inactive':
        return { color: 'default', label: 'Inactive' };
      case 'lead':
        return { color: 'info', label: 'Lead' };
      case 'blocked':
        return { color: 'error', label: 'Blocked' };
      default:
        return { color: 'default', label: status || 'Unknown' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Loading client profile...
        </Typography>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="error" gutterBottom sx={{ fontWeight: 800 }}>
          Client Profile Not Found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          The client details you are looking for might have been deleted or doesn't belong to your account.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/clients')}>
          Back to Clients
        </Button>
      </Box>
    );
  }

  const statusInfo = getStatusDetails(client.status);
  const parsedTags = Array.isArray(client.tags)
    ? client.tags
    : typeof client.tags === 'string'
    ? JSON.parse(client.tags || '[]')
    : [];

  // Formatted currency helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Back button and Edit */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/clients')}
          sx={{ color: 'text.secondary' }}
        >
          Back to Clients
        </Button>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/clients/${client.id}/edit`)}
          sx={{ py: 0.75, px: 2 }}
        >
          Edit Profile
        </Button>
      </Box>

      {/* 1. Header Profile Banner */}
      <Card
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: 80,
              height: 80,
              borderRadius: 4,
              fontSize: '2rem',
              fontWeight: 800,
              boxShadow: 2
            }}
          >
            {client.company ? client.company.substring(0, 2).toUpperCase() : client.name.substring(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ textAlign: { xs: 'center', md: 'left' }, flexGrow: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                {client.company || 'Private Practice'}
              </Typography>
              <Chip
                label={statusInfo.label}
                size="small"
                color={statusInfo.color}
                variant="soft"
                sx={{ fontWeight: 700, fontSize: '0.725rem', height: 22 }}
              />
            </Stack>

            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
              Contact: {client.name}
            </Typography>

            {parsedTags.length > 0 && (
              <Stack direction="row" spacing={1} justifyContent={{ xs: 'center', md: 'flex-start' }} useFlexGap flexWrap="wrap">
                {parsedTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Card>

      {/* 2. Profile Details Layout Grid */}
      <Grid container spacing={3}>
        {/* Left column: Contact Coordinates and Notes */}
        <Grid item xs={12} lg={8} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Contact Information Card */}
          <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContactIcon color="primary" fontSize="small" />
              Contact Information
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Email Address
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {client.email}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Phone Number
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {client.phone || '--'}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Office Address
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <AddressIcon fontSize="small" color="action" sx={{ mt: 0.2 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.5 }}>
                    {client.address}, {client.city}, {client.state} - {client.postalCode}, {client.country}
                  </Typography>
                </Box>
              </Grid>

              {client.gstNumber && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    GST Identification Number (GSTIN)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {client.gstNumber}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Card>

          {/* Notes Card */}
          <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider', flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InvoiceIcon color="primary" fontSize="small" />
              Client Notes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {client.notes ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  p: 2,
                  borderRadius: 2,
                  border: '1.5px solid',
                  borderColor: 'divider',
                  fontStyle: 'italic'
                }}
              >
                "{client.notes}"
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No notes provided for this client. You can add guidelines, preference details or contract conditions in edit mode.
              </Typography>
            )}
          </Card>
        </Grid>

        {/* Right column: Business Summary and Timeline */}
        <Grid item xs={12} lg={4} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Business Summary Card */}
          <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendIcon color="primary" fontSize="small" />
              Business Summary
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ProjectIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">Total Projects</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>5</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendIcon fontSize="small" color="success" />
                  <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {formatCurrency(120000)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaymentIcon fontSize="small" color="error" />
                  <Typography variant="body2" color="text.secondary">Pending Payments</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {formatCurrency(15000)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InvoiceIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">Last Payment</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Jul 15, 2026
                </Typography>
              </Box>
            </Stack>
          </Card>

          {/* Activity Timeline Card */}
          <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
              Recent Activity
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, position: 'relative', pl: 1 }}>
              {/* Timeline Connector Line */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 13,
                  top: 8,
                  bottom: 8,
                  width: '2px',
                  bgcolor: 'divider'
                }}
              />

              {/* Step 4 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                <TimelineDot sx={{ fontSize: '0.8rem', color: 'success.main', zIndex: 1, mt: 0.4, border: '4px solid', borderColor: 'background.paper', borderRadius: '50%' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Payment Received
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    ₹35,000 recorded via bank transfer
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.675rem' }}>
                    July 15, 2026
                  </Typography>
                </Box>
              </Box>

              {/* Step 3 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                <TimelineDot sx={{ fontSize: '0.8rem', color: 'primary.main', zIndex: 1, mt: 0.4, border: '4px solid', borderColor: 'background.paper', borderRadius: '50%' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Invoice #INV-2026-009 Generated
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Billing amount: ₹50,000 for phase-2 design completion
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.675rem' }}>
                    July 01, 2026
                  </Typography>
                </Box>
              </Box>

              {/* Step 2 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                <TimelineDot sx={{ fontSize: '0.8rem', color: 'info.main', zIndex: 1, mt: 0.4, border: '4px solid', borderColor: 'background.paper', borderRadius: '50%' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Profile Updated
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    GST details and office address verified
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.675rem' }}>
                    June 12, 2026
                  </Typography>
                </Box>
              </Box>

              {/* Step 1 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                <TimelineDot sx={{ fontSize: '0.8rem', color: 'text.secondary', zIndex: 1, mt: 0.4, border: '4px solid', borderColor: 'background.paper', borderRadius: '50%' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Client Created
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Client record registered by {client.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.675rem' }}>
                    {new Date(client.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

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

export default ClientProfilePage;
