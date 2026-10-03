import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  AccountBalanceWalletOutlined as WalletIcon,
  CheckCircleOutline as CheckIcon
} from '@mui/icons-material';
import api from '../../services/api';

const PAYMENT_METHODS = [
  'UPI',
  'Bank Transfer',
  'Cash',
  'Card',
  'Cheque',
  'Other'
];

const RecordPaymentModal = ({ open, onClose, invoice, onPaymentRecorded }) => {
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalInvoiceAmount = invoice?.amount || 0;
  const previouslyPaid = invoice?.payments ? invoice.payments.reduce((sum, p) => sum + p.amountPaid, 0) : 0;
  const remainingBalance = Math.max(0, totalInvoiceAmount - previouslyPaid);

  useEffect(() => {
    if (open && invoice) {
      setAmountPaid(remainingBalance > 0 ? remainingBalance.toString() : '');
      const today = new Date().toISOString().split('T')[0];
      setPaymentDate(today);
      setPaymentMethod('UPI');
      setReferenceId('');
      setNotes('');
      setError('');
    }
  }, [open, invoice, remainingBalance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(amountPaid);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    if (!paymentDate) {
      setError('Please select a payment date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/payments', {
        invoiceId: invoice.id,
        amountPaid: numericAmount,
        paymentDate,
        paymentMethod,
        referenceId,
        notes,
      });

      if (onPaymentRecorded) {
        onPaymentRecorded(response.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to record payment:', err);
      setError(err.response?.data?.error || 'Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clientName = invoice?.project?.client?.name || invoice?.project?.client?.company || 'Client';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.contrastText', display: 'flex' }}>
          <WalletIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Record Payment
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Invoice #{invoice?.invoiceNumber} • {clientName}
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ pt: 2, pb: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Balance Breakdown Summary Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2.5,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.7)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Invoice Amount
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  ₹{totalInvoiceAmount.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Previously Paid
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.main' }}>
                  ₹{previouslyPaid.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Remaining Balance
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: remainingBalance > 0 ? 'warning.main' : 'text.secondary' }}>
                  ₹{remainingBalance.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Form Inputs */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount Received"
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Transaction / Reference ID"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. UPI123456789 or TXN-9988"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Payment Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add optional notes (e.g. September milestone payment)"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button onClick={onClose} color="inherit" disabled={loading} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RecordPaymentModal;
