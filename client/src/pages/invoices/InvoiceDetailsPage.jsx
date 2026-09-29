import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Breadcrumbs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  useTheme
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as ClientIcon,
  Business as CompanyIcon,
  Mail as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as DateIcon,
  CurrencyRupee as MoneyIcon,
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  Print as PrintIcon,
  CheckCircle as PaidIcon,
  FolderSpecial as ProjectIcon,
  RemoveCircleOutline as RemoveIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { getInvoiceById, updateInvoice, deleteInvoice, recordPayment } from '../../services/invoiceService';
import { getProjects } from '../../services/projectService';
import { getProfile } from '../../services/profileService';
import { generateUpiUri } from '../../utils/upiQr';
import { QRCodeSVG } from 'qrcode.react';

const STATUS_COLORS = {
  'Draft': 'default',
  'Sent': 'info',
  'Pending': 'warning',
  'Partially Paid': 'secondary',
  'Paid': 'success',
  'Overdue': 'error',
  'Cancelled': 'error'
};

const InvoiceDetailsPage = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [invoice, setInvoice] = useState(null);
  const [projects, setProjects] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Dialog State
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    status: 'Pending',
    items: [],
    discount: 0,
    taxRate: 18,
    notes: '',
    amountPaid: '0'
  });
  const [submitting, setSubmitting] = useState(false);

  // Record Payment State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amountPaid: '',
    paymentMethod: 'UPI',
    referenceId: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const [invoiceData, projectsData, profileData] = await Promise.all([
        getInvoiceById(id),
        getProjects(),
        getProfile().catch(() => null)
      ]);
      setInvoice(invoiceData);
      setProjects(projectsData || []);
      setProfile(profileData || null);
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      showSnackbar(err.message || 'Failed to load invoice details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  // Edit Handlers
  const handleOpenEditDialog = () => {
    if (!invoice) return;
    const paidSoFar = (invoice.payments || []).reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    const existingItems = Array.isArray(invoice.items) && invoice.items.length > 0
      ? invoice.items
      : [{ description: 'Services Rendered', qty: 1, rate: invoice.amount, amount: invoice.amount }];

    setFormData({
      projectId: invoice.projectId || invoice.project?.id || '',
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      status: invoice.status || 'Pending',
      items: existingItems,
      discount: invoice.discount || 0,
      taxRate: invoice.taxRate !== undefined ? invoice.taxRate : 18,
      notes: invoice.notes || 'Payment terms: Net 15 days.',
      amountPaid: paidSoFar.toString()
    });
    setFormDialogOpen(true);
  };

  const calculateModalTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.qty || 1) * Number(item.rate || 0)), 0);
    const discount = Number(formData.discount || 0);
    const taxRate = Number(formData.taxRate || 0);
    const taxable = Math.max(0, subtotal - discount);
    const taxAmount = Math.round(taxable * (taxRate / 100));
    const totalAmount = Math.max(0, taxable + taxAmount);
    return { subtotal, discount, taxRate, taxAmount, totalAmount };
  };

  const modalTotals = calculateModalTotals();

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    if (field === 'qty' || field === 'rate') {
      const q = parseFloat(field === 'qty' ? value : updatedItems[index].qty) || 0;
      const r = parseFloat(field === 'rate' ? value : updatedItems[index].rate) || 0;
      updatedItems[index].amount = q * r;
    }
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', qty: 1, rate: 0, amount: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleStatusChange = (newStatus) => {
    let newPaid = formData.amountPaid;
    const total = modalTotals.totalAmount;

    if (newStatus === 'Paid') {
      newPaid = total.toString();
    } else if (newStatus === 'Unpaid' || newStatus === 'Draft' || newStatus === 'Pending') {
      newPaid = '0';
    } else if (newStatus === 'Partially Paid') {
      const current = Number(formData.amountPaid) || 0;
      if (current === 0 || current >= total) {
        newPaid = (total / 2).toString();
      }
    }

    setFormData(prev => ({
      ...prev,
      status: newStatus,
      amountPaid: newPaid
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectId) {
      showSnackbar('Please select a Project.', 'error');
      return;
    }
    if (modalTotals.totalAmount <= 0) {
      showSnackbar('Invoice total must be greater than zero.', 'error');
      return;
    }
    if (!formData.dueDate) {
      showSnackbar('Due Date is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const selectedProj = projects.find(p => p.id === parseInt(formData.projectId, 10));

      const payload = {
        ...formData,
        projectId: parseInt(formData.projectId, 10),
        amount: modalTotals.totalAmount,
        subtotal: modalTotals.subtotal,
        discount: modalTotals.discount,
        taxRate: modalTotals.taxRate,
        taxAmount: modalTotals.taxAmount,
        amountPaid: parseFloat(formData.amountPaid) || 0,
        project: selectedProj ? { id: selectedProj.id, title: selectedProj.title, client: selectedProj.client } : invoice.project
      };

      const updated = await updateInvoice(id, payload);
      setInvoice(updated);
      showSnackbar('Invoice updated successfully.');
      setFormDialogOpen(false);
    } catch (err) {
      console.error('Error updating invoice:', err);
      showSnackbar(err.message || 'Failed to update invoice.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Record Payment Handlers
  const handleOpenPaymentDialog = () => {
    if (!invoice) return;
    const paid = (invoice.payments || []).reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    const due = Math.max(0, invoice.amount - paid);

    setPaymentData({
      amountPaid: due > 0 ? due : '',
      paymentMethod: 'UPI',
      referenceId: '',
      notes: '',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!invoice) return;

    if (!paymentData.amountPaid || isNaN(paymentData.amountPaid) || Number(paymentData.amountPaid) <= 0) {
      showSnackbar('Please enter a valid payment amount.', 'error');
      return;
    }

    try {
      setSubmittingPayment(true);
      const updated = await recordPayment(id, {
        amountPaid: parseFloat(paymentData.amountPaid),
        paymentMethod: paymentData.paymentMethod,
        referenceId: paymentData.referenceId,
        notes: paymentData.notes,
        paymentDate: paymentData.paymentDate
      });

      setInvoice(updated);
      showSnackbar('Payment recorded successfully.');
      setPaymentDialogOpen(false);
    } catch (err) {
      console.error('Error recording payment:', err);
      showSnackbar(err.message || 'Failed to record payment.', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteInvoice(id);
      showSnackbar('Invoice deleted successfully.');
      navigate('/invoices');
    } catch (err) {
      console.error('Error deleting invoice:', err);
      showSnackbar(err.message || 'Failed to delete invoice.', 'error');
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Paper sx={{ p: 5, maxWidth: 500, margin: '0 auto', borderRadius: 3 }}>
          <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: 700 }}>
            Invoice Not Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The invoice you are looking for does not exist or has been removed.
          </Typography>
          <Button variant="contained" component={Link} to="/invoices" startIcon={<BackIcon />}>
            Back to Invoices
          </Button>
        </Paper>
      </Box>
    );
  }

  // Financial Calculations
  const payments = invoice.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  const remainingBalance = Math.max(0, invoice.amount - totalPaid);
  const progress = invoice.amount > 0 ? Math.min(100, Math.round((totalPaid / invoice.amount) * 100)) : 0;
  const items = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [{ description: invoice.project?.title || 'Services Rendered', qty: 1, rate: invoice.amount, amount: invoice.amount }];

  const subtotal = invoice.subtotal || items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const discount = invoice.discount || 0;
  const taxRate = invoice.taxRate !== undefined ? invoice.taxRate : 18;
  const taxAmount = invoice.taxAmount !== undefined ? invoice.taxAmount : Math.round((subtotal - discount) * (taxRate / 100));

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, margin: '0 auto' }}>
      {/* Navigation Breadcrumb */}
      <Box sx={{ mb: 3 }} className="no-print">
        <Breadcrumbs aria-label="breadcrumb">
          <Button
            component={Link}
            to="/invoices"
            startIcon={<BackIcon />}
            sx={{ textTransform: 'none', fontWeight: 600, px: 0 }}
            color="inherit"
          >
            Invoices
          </Button>
          <Typography color="text.primary" sx={{ fontWeight: 700 }}>
            #{invoice.invoiceNumber}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Main Header Banner */}
      <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, mb: 4, boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }} className="no-print">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                label={invoice.status}
                color={STATUS_COLORS[invoice.status] || 'default'}
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
              Invoice #{invoice.invoiceNumber}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
              <Button variant="contained" color="success" startIcon={<PaymentIcon />} onClick={handleOpenPaymentDialog} sx={{ borderRadius: 2, fontWeight: 700 }}>
                Record Payment
              </Button>
            )}
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ borderRadius: 2, fontWeight: 700 }}>
              Print / PDF
            </Button>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleOpenEditDialog} sx={{ borderRadius: 2, fontWeight: 700 }}>
              Edit
            </Button>
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteDialogOpen(true)} sx={{ borderRadius: 2, fontWeight: 700 }}>
              Delete
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Printable Invoice Document */}
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, mb: 4, boxShadow: '0 3px 20px rgba(0,0,0,0.06)' }} id="printable-invoice">
        {/* Invoice Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.5px' }}>
              ClientFlow OS
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Professional Freelance & Business Suite
            </Typography>
          </Box>

          <Box sx={{ textAlign: { sm: 'right' } }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              INVOICE
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
              #{invoice.invoiceNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Invoice Date: {formatDate(invoice.invoiceDate || invoice.createdAt)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Due Date: {formatDate(invoice.dueDate)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Billed To / Project Information */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Billed To:
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
              {invoice.project?.client?.name || 'Client Name'}
            </Typography>
            {invoice.project?.client?.company && (
              <Typography variant="body2" color="text.secondary">
                {invoice.project.client.company}
              </Typography>
            )}
            {invoice.project?.client?.email && (
              <Typography variant="body2" color="text.secondary">
                {invoice.project.client.email}
              </Typography>
            )}
            {invoice.project?.client?.phone && (
              <Typography variant="body2" color="text.secondary">
                {invoice.project.client.phone}
              </Typography>
            )}
            {invoice.project?.client?.address && (
              <Typography variant="caption" color="text.secondary" display="block">
                {invoice.project.client.address}, {invoice.project.client.city || ''}
              </Typography>
            )}
            {invoice.project?.client?.gstNumber && (
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }} display="block">
                GST / Tax ID: {invoice.project.client.gstNumber}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Project Context:
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
              {invoice.project?.title || 'Project Title'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Status: {invoice.status}
            </Typography>
          </Grid>
        </Grid>

        {/* Line Items Table */}
        <TableContainer sx={{ mb: 4 }}>
          <Table>
            <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Rate</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontWeight: 600 }}>{item.description || 'Services Rendered'}</TableCell>
                  <TableCell align="center">{item.qty || 1}</TableCell>
                  <TableCell align="right">{formatCurrency(item.rate)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Financial Totals Calculation Box */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Box sx={{ width: { xs: '100%', sm: 320 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(subtotal)}</Typography>
            </Box>

            {discount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Discount:</Typography>
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>-{formatCurrency(discount)}</Typography>
              </Box>
            )}

            {taxRate > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">GST / Tax ({taxRate}%):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>+{formatCurrency(taxAmount)}</Typography>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Grand Total:</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {formatCurrency(invoice.amount)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Amount Paid:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                {formatCurrency(totalPaid)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Remaining Due:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: remainingBalance > 0 ? 'warning.dark' : 'text.secondary' }}>
                {formatCurrency(remainingBalance)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Payment History Ledger */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Payment History Ledger
          </Typography>
          {payments.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center', bgcolor: theme.palette.action.hover, borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No payments recorded for this invoice yet.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Transaction / Ref ID</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Amount Paid</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.paymentDate)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.paymentMethod}</TableCell>
                      <TableCell>{p.referenceId || 'N/A'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {formatCurrency(p.amountPaid)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Payment Information & UPI QR Code Section */}
        {(profile?.upiId || profile?.paymentQrUrl || profile?.paymentInstructions) && (
          <Paper variant="outlined" sx={{ p: 2.5, mt: 4, borderRadius: 2, bgcolor: '#f8fafc' }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={profile?.paymentQrUrl || profile?.upiId ? 8 : 12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaymentIcon fontSize="small" /> Payment Details
                </Typography>

                {profile?.upiId && (
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    UPI ID (VPA): <Box component="span" sx={{ fontFamily: 'monospace', color: 'primary.dark', bgcolor: '#e2e8f0', px: 1, py: 0.25, borderRadius: 1 }}>{profile.upiId}</Box>
                  </Typography>
                )}

                {profile?.paymentInstructions && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whitespace: 'pre-line' }}>
                    {profile.paymentInstructions}
                  </Typography>
                )}
              </Grid>

              {(profile?.paymentQrUrl || profile?.upiId) && (
                <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Box sx={{ display: 'inline-block', textAlign: 'center', p: 1.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    {profile.paymentQrUrl ? (
                      <Box
                        component="img"
                        src={profile.paymentQrUrl}
                        alt="Payment QR Code"
                        sx={{ width: 130, height: 130, objectFit: 'contain' }}
                      />
                    ) : profile.upiId ? (
                      <QRCodeSVG
                        value={generateUpiUri({
                          upiId: profile.upiId,
                          payeeName: profile.fullName,
                          amount: remainingBalance > 0 ? remainingBalance : invoice.amount,
                          invoiceNumber: invoice.invoiceNumber
                        })}
                        size={130}
                        level="H"
                        includeMargin={true}
                      />
                    ) : null}
                    <Typography variant="caption" display="block" sx={{ mt: 0.5, fontWeight: 700, color: 'text.secondary' }}>
                      Scan to Pay via UPI
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* Notes & Terms & Conditions */}
        {invoice.notes && (
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Terms & Conditions / Notes:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.notes}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Edit Invoice Dialog */}
      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>Edit Invoice</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel id="edit-invoice-project-select-label">Project</InputLabel>
                <Select
                  labelId="edit-invoice-project-select-label"
                  value={formData.projectId || ''}
                  label="Project"
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                >
                  {projects.length === 0 ? (
                    <MenuItem value="" disabled>
                      No projects found.
                    </MenuItem>
                  ) : (
                    projects.map((proj) => (
                      <MenuItem key={proj.id} value={proj.id}>
                        {proj.title} ({proj.client?.name || proj.client?.company || 'Client'})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Invoice Number"
                    fullWidth
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Invoice Date"
                    type="date"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Due Date"
                    type="date"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </Grid>
              </Grid>

              {/* Itemized Line Items */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Invoice Line Items
                  </Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={handleAddItem} variant="outlined">
                    Add Item
                  </Button>
                </Box>

                {formData.items.map((item, idx) => (
                  <Grid container spacing={1.5} key={idx} alignItems="center" sx={{ mb: 1.5 }}>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={4} sm={2}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={4} sm={2.5}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        placeholder="Rate (₹)"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                      />
                    </Grid>

                    <Grid item xs={3} sm={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 60 }}>
                        {formatCurrency(Number(item.qty || 1) * Number(item.rate || 0))}
                      </Typography>
                      {formData.items.length > 1 && (
                        <IconButton size="small" color="error" onClick={() => handleRemoveItem(idx)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                ))}
              </Box>

              <Divider />

              {/* Financial Calculation Box */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required sx={{ mb: 2 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      <MenuItem value="Draft">Draft</MenuItem>
                      <MenuItem value="Sent">Sent</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Partially Paid">Partially Paid</MenuItem>
                      <MenuItem value="Paid">Paid</MenuItem>
                      <MenuItem value="Overdue">Overdue</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Amount Paid So Far (₹)"
                    type="number"
                    fullWidth
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(modalTotals.subtotal)}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Discount (₹):</Typography>
                      <TextField
                        size="small"
                        type="number"
                        sx={{ width: 110 }}
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Tax / GST (%):</Typography>
                      <TextField
                        size="small"
                        type="number"
                        sx={{ width: 110 }}
                        value={formData.taxRate}
                        onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                      />
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Amount:</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {formatCurrency(modalTotals.totalAmount)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <TextField
                label="Notes / Terms & Conditions"
                multiline
                rows={2}
                fullWidth
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setFormDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={18} /> : null}>
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handlePaymentSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Record Payment #{invoice?.invoiceNumber}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                label="Amount Paid (₹)"
                type="number"
                fullWidth
                required
                value={paymentData.amountPaid}
                onChange={(e) => setPaymentData({ ...paymentData, amountPaid: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />

              <FormControl fullWidth required>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentData.paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                >
                  <MenuItem value="UPI">UPI / GPay / PhonePe</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer (NEFT/IMPS)</MenuItem>
                  <MenuItem value="Credit Card">Credit / Debit Card</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Transaction / Reference ID (UPI Ref / UTR)"
                fullWidth
                placeholder="e.g. UPI-9842103984 or NEFT-88301"
                value={paymentData.referenceId}
                onChange={(e) => setPaymentData({ ...paymentData, referenceId: e.target.value })}
              />

              <TextField
                label="Payment Date"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setPaymentDialogOpen(false)} disabled={submittingPayment}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="success" disabled={submittingPayment} startIcon={submittingPayment ? <CircularProgress size={18} /> : null}>
              Save Payment
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Delete Invoice
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete invoice <strong>#{invoice.invoiceNumber}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InvoiceDetailsPage;
