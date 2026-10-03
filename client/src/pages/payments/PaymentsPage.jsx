import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  TrendingUp as RevenueIcon,
  HourglassEmpty as PendingIcon,
  WarningOutlined as OverdueIcon,
  ReceiptLongOutlined as InvoiceIcon,
  VisibilityOutlined as ViewIcon,
  DeleteOutline as DeleteIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const PaymentsPage = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalReceived: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    paymentCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');

  // Selected payment modal details
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.q = searchQuery;
      if (paymentMethodFilter !== 'All') params.paymentMethod = paymentMethodFilter;

      const response = await api.get('/payments', { params });
      setPayments(response.data.payments || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setError('Failed to load payments ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [searchQuery, paymentMethodFilter]);

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record? Invoice status will be recalculated automatically.')) {
      return;
    }
    try {
      await api.delete(`/payments/${paymentId}`);
      if (detailsOpen) setDetailsOpen(false);
      fetchPayments();
    } catch (err) {
      console.error('Failed to delete payment:', err);
      alert(err.response?.data?.error || 'Failed to delete payment record.');
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'UPI':
        return 'primary';
      case 'Bank Transfer':
        return 'info';
      case 'Cash':
        return 'success';
      case 'Card':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Header Banner */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            Payments & Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Audit trail of recorded client payments, transaction reference IDs, and financial summary.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<InvoiceIcon />}
          onClick={() => navigate('/invoices')}
          sx={{ borderRadius: 2.5, px: 3, fontWeight: 600 }}
        >
          View Invoices
        </Button>
      </Box>

      {/* Summary KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Revenue Received
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'success.light', color: 'success.contrastText', display: 'flex' }}>
                  <RevenueIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>
                ₹{(summary.totalReceived || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Across {summary.paymentCount || 0} recorded transaction(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Outstanding Balance
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.contrastText', display: 'flex' }}>
                  <PendingIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main' }}>
                ₹{(summary.totalOutstanding || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Unpaid invoice balances
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Overdue Payments
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'error.light', color: 'error.contrastText', display: 'flex' }}>
                  <OverdueIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main' }}>
                ₹{(summary.totalOverdue || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Past invoice due dates
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Ledger Records
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.contrastText', display: 'flex' }}>
                  <WalletIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {payments.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Filtered transactions count
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter & Search Toolbar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={7} md={8}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by client name, invoice number, reference ID, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={5} md={4}>
            <TextField
              fullWidth
              select
              size="small"
              label="Payment Method"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              <MenuItem value="All">All Methods</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Card">Card</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Ledger Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading payment transactions...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 4 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : payments.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <WalletIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              No Payment Transactions Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Record payments against invoices to generate your transaction ledger.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 700 }}>
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.6)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Amount Paid</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Payment Method</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reference ID</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => {
                  const client = p.invoice?.project?.client;
                  const clientName = client?.name || client?.company || 'N/A';
                  return (
                    <TableRow key={p.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {clientName}
                        </Typography>
                        {client?.company && client.name !== client.company && (
                          <Typography variant="caption" color="text.secondary">
                            {client.company}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.invoice?.invoiceNumber || 'N/A'}
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/invoices/${p.invoiceId}`)}
                          clickable
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                        ₹{p.amountPaid.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.paymentMethod}
                          size="small"
                          color={getMethodColor(p.paymentMethod)}
                          variant="soft"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: p.referenceId ? 'text.primary' : 'text.secondary' }}>
                          {p.referenceId || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Transaction Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedPayment(p);
                              setDetailsOpen(true);
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Transaction Record">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePayment(p.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Payment Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Payment Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedPayment && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Payment ID
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  PAY-{String(selectedPayment.id).padStart(4, '0')}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Client
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedPayment.invoice?.project?.client?.name || 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Invoice
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedPayment.invoice?.invoiceNumber}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Amount Received
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main' }}>
                  ₹{selectedPayment.amountPaid.toLocaleString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Payment Date
                </Typography>
                <Typography variant="body2">
                  {new Date(selectedPayment.paymentDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Payment Method
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedPayment.paymentMethod}
                </Typography>
              </Box>

              {selectedPayment.referenceId && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Transaction / Reference ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {selectedPayment.referenceId}
                  </Typography>
                </Box>
              )}

              {selectedPayment.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    {selectedPayment.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            color="error"
            onClick={() => handleDeletePayment(selectedPayment?.id)}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
          <Button onClick={() => setDetailsOpen(false)} variant="contained" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsPage;
