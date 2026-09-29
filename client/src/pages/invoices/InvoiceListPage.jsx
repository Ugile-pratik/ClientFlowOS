import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GridView as GridViewIcon,
  TableRows as TableViewIcon,
  Receipt as InvoiceIcon,
  FolderSpecial as ProjectIcon,
  Person as ClientIcon,
  CurrencyRupee as MoneyIcon,
  CalendarToday as DateIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
  CheckCircle as PaidIcon,
  WarningAmber as OverdueIcon,
  RemoveCircleOutline as RemoveIcon,
  Description as TermsIcon
} from '@mui/icons-material';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, recordPayment } from '../../services/invoiceService';
import { getProjects } from '../../services/projectService';

const STATUS_COLORS = {
  'Draft': 'default',
  'Sent': 'info',
  'Pending': 'warning',
  'Partially Paid': 'secondary',
  'Paid': 'success',
  'Overdue': 'error',
  'Cancelled': 'error'
};

const InvoiceListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Create / Edit Modal State
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({
    projectId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Pending',
    items: [
      { description: 'Services Rendered', qty: 1, rate: 0, amount: 0 }
    ],
    discount: 0,
    taxRate: 18,
    notes: 'Payment terms: Net 15 days. Thank you for your business!',
    amountPaid: '0'
  });
  const [submitting, setSubmitting] = useState(false);

  // Record Payment Modal State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
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
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'All') params.status = statusFilter;
      if (projectFilter) params.projectId = projectFilter;
      if (searchQuery) params.q = searchQuery;

      const [invoicesData, projectsData] = await Promise.all([
        getInvoices(params),
        getProjects()
      ]);

      setInvoices(invoicesData || []);
      setProjects(projectsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      showSnackbar(err.message || 'Failed to load invoices data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, statusFilter, projectFilter]);

  // Compute Metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => {
    const paid = (inv.payments || []).reduce((pSum, p) => pSum + (Number(p.amountPaid) || 0), 0);
    return sum + paid;
  }, 0);
  const outstandingBalance = Math.max(0, totalInvoiced - totalCollected);
  const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length;

  // Selected project helper for auto-populating client info
  const selectedProjectObj = projects.find(p => p.id === parseInt(formData.projectId, 10));

  // Itemized Calculations
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

  // Form Handlers (Create / Edit)
  const handleOpenAddDialog = () => {
    setEditingInvoice(null);
    const firstProj = projects.length > 0 ? projects[0] : null;
    const initialRate = firstProj ? firstProj.budget : 0;

    setFormData({
      projectId: firstProj ? firstProj.id : '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      items: [
        { description: firstProj ? `${firstProj.title} Deliverables` : 'Services Rendered', qty: 1, rate: initialRate, amount: initialRate }
      ],
      discount: 0,
      taxRate: 18,
      notes: 'Payment terms: Net 15 days. Thank you for your business!',
      amountPaid: '0'
    });
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (invoice, e) => {
    e.stopPropagation();
    setEditingInvoice(invoice);
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

  const handleProjectSelect = (projId) => {
    const selectedProj = projects.find(p => p.id === parseInt(projId, 10));
    setFormData(prev => ({
      ...prev,
      projectId: projId,
      items: [
        { description: selectedProj ? `${selectedProj.title} Deliverables` : 'Services Rendered', qty: 1, rate: selectedProj ? selectedProj.budget : 0, amount: selectedProj ? selectedProj.budget : 0 }
      ]
    }));
  };

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
        project: selectedProj ? { id: selectedProj.id, title: selectedProj.title, client: selectedProj.client } : undefined
      };

      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, payload);
        showSnackbar('Invoice updated successfully.');
      } else {
        await createInvoice(payload);
        showSnackbar('Invoice generated successfully.');
      }

      setFormDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving invoice:', err);
      showSnackbar(err.message || 'Failed to save invoice.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Record Payment Handlers
  const handleOpenPaymentDialog = (invoice, e) => {
    e.stopPropagation();
    setSelectedInvoice(invoice);
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
    if (!selectedInvoice) return;

    if (!paymentData.amountPaid || isNaN(paymentData.amountPaid) || Number(paymentData.amountPaid) <= 0) {
      showSnackbar('Please enter a valid payment amount.', 'error');
      return;
    }

    try {
      setSubmittingPayment(true);
      await recordPayment(selectedInvoice.id, {
        amountPaid: parseFloat(paymentData.amountPaid),
        paymentMethod: paymentData.paymentMethod,
        referenceId: paymentData.referenceId,
        notes: paymentData.notes,
        paymentDate: paymentData.paymentDate
      });

      showSnackbar('Payment recorded successfully.');
      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
      fetchData();
    } catch (err) {
      console.error('Error recording payment:', err);
      showSnackbar(err.message || 'Failed to record payment.', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Delete Handlers
  const handleOpenDeleteDialog = (invoice, e) => {
    e.stopPropagation();
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      setDeleting(true);
      await deleteInvoice(invoiceToDelete.id);
      showSnackbar('Invoice deleted successfully.');
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      showSnackbar(err.message || 'Failed to delete invoice.', 'error');
    } finally {
      setDeleting(false);
    }
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

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
            Invoices & Payments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your project billings, record payments, and track outstanding balances.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.2,
            fontWeight: 700,
            boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.39)'
          }}
        >
          Create Invoice
        </Button>
      </Box>

      {/* Top Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', p: 0.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.light + '25', color: theme.palette.primary.main, width: 48, height: 48 }}>
                <InvoiceIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Invoiced
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {formatCurrency(totalInvoiced)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', p: 0.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.success.light + '25', color: theme.palette.success.main, width: 48, height: 48 }}>
                <PaidIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Collected
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main' }}>
                  {formatCurrency(totalCollected)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', p: 0.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.warning.light + '25', color: theme.palette.warning.dark, width: 48, height: 48 }}>
                <WalletIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Pending Balance
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'warning.dark' }}>
                  {formatCurrency(outstandingBalance)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', p: 0.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.error.light + '25', color: theme.palette.error.main, width: 48, height: 48 }}>
                <OverdueIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Overdue Invoices
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'error.main' }}>
                  {overdueCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Card sx={{ borderRadius: 3, p: 2, mb: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by invoice #, project, client..."
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

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="All">All Statuses</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Sent">Sent</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Partially Paid">Partially Paid</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Overdue">Overdue</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Project</InputLabel>
              <Select
                value={projectFilter}
                label="Filter by Project"
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <MenuItem value="">All Projects</MenuItem>
                {projects.map(p => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.title} ({p.client?.name || 'N/A'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(e, val) => val && setViewMode(val)}
              aria-label="view mode"
            >
              <ToggleButton value="grid" aria-label="grid view">
                <Tooltip title="Grid View">
                  <GridViewIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="table" aria-label="table view">
                <Tooltip title="Table View">
                  <TableViewIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : invoices.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <InvoiceIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No invoices found
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            {searchQuery || statusFilter !== 'All' || projectFilter
              ? 'Try resetting your search filters or create a new invoice.'
              : 'Get started by creating your first project invoice.'}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog}>
            Create Invoice
          </Button>
        </Paper>
      ) : viewMode === 'grid' ? (
        /* Grid Card View */
        <Grid container spacing={3}>
          {invoices.map((invoice) => {
            const paidAmount = (invoice.payments || []).reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
            const remaining = Math.max(0, invoice.amount - paidAmount);
            const progress = invoice.amount > 0 ? Math.min(100, Math.round((paidAmount / invoice.amount) * 100)) : 0;

            return (
              <Grid item xs={12} sm={6} md={4} key={invoice.id}>
                <Card
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 3px 12px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Invoice # & Status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                          #{invoice.invoiceNumber}
                        </Typography>
                        <Chip
                          label={invoice.status}
                          color={STATUS_COLORS[invoice.status] || 'default'}
                          size="small"
                          sx={{ fontWeight: 700, borderRadius: 1.5, mt: 0.5 }}
                        />
                      </Box>
                      <Box onClick={(e) => e.stopPropagation()}>
                        <IconButton size="small" onClick={(e) => handleOpenEditDialog(invoice, e)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => handleOpenDeleteDialog(invoice, e)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Project & Client */}
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                      {invoice.project?.title || 'Project'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 2 }}>
                      {invoice.project?.client?.name || 'Client'}
                      {invoice.project?.client?.company ? ` (${invoice.project.client.company})` : ''}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Progress Bar */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Paid: {formatCurrency(paidAmount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {progress}%
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>

                    {/* Amount & Due Date */}
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total Amount
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {formatCurrency(invoice.amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Due Date
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DateIcon fontSize="inherit" color="action" />
                          {formatDate(invoice.dueDate)}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Record Payment Action Button */}
                    {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        startIcon={<PaymentIcon />}
                        onClick={(e) => handleOpenPaymentDialog(invoice, e)}
                        sx={{ borderRadius: 2, fontWeight: 700, mt: 'auto' }}
                      >
                        Record Payment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* Table View */
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Project & Client</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Collected</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => {
                const paidAmount = (invoice.payments || []).reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

                return (
                  <TableRow key={invoice.id} hover onClick={() => navigate(`/invoices/${invoice.id}`)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>
                      #{invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {invoice.project?.title || 'Project'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.project?.client?.name || 'Client'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        color={STATUS_COLORS[invoice.status] || 'default'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                      {formatCurrency(paidAmount)}
                    </TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
                        <IconButton size="small" onClick={(e) => handleOpenPaymentDialog(invoice, e)} color="success">
                          <PaymentIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={(e) => handleOpenEditDialog(invoice, e)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={(e) => handleOpenDeleteDialog(invoice, e)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Advanced Create / Edit Invoice Dialog */}
      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingInvoice ? 'Edit Invoice' : 'Generate New Invoice'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Project & Client Selection */}
              <FormControl fullWidth required>
                <InputLabel id="invoice-project-select-label">Select Project</InputLabel>
                <Select
                  labelId="invoice-project-select-label"
                  value={formData.projectId || ''}
                  label="Select Project"
                  onChange={(e) => handleProjectSelect(e.target.value)}
                >
                  {projects.length === 0 ? (
                    <MenuItem value="" disabled>
                      No projects found. Please create a project first.
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

              {/* Auto-Populated Client Details Box */}
              {selectedProjectObj && selectedProjectObj.client && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.action.hover }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Auto-Populated Client Info:
                  </Typography>
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {selectedProjectObj.client.name} {selectedProjectObj.client.company ? `(${selectedProjectObj.client.company})` : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {selectedProjectObj.client.email} | {selectedProjectObj.client.phone || 'No Phone'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Address: {selectedProjectObj.client.address || 'N/A'}, {selectedProjectObj.client.city || ''}
                      </Typography>
                      {selectedProjectObj.client.gstNumber && (
                        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }} display="block">
                          GST / Tax ID: {selectedProjectObj.client.gstNumber}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Invoice Metadata Row */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Invoice Number"
                    fullWidth
                    placeholder="Auto-generated (INV-2026-001)"
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

              {/* Itemized Line Items Section */}
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
                        placeholder="Item description (e.g. UI Design)"
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
                    <InputLabel>Invoice Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Invoice Status"
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
                    helperText={
                      Number(formData.amountPaid) > 0 && Number(formData.amountPaid) < modalTotals.totalAmount
                        ? `Remaining Due: ${formatCurrency(modalTotals.totalAmount - Number(formData.amountPaid))}`
                        : ''
                    }
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

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Tax Amount:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(modalTotals.taxAmount)}</Typography>
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

              {/* Notes & Terms */}
              <TextField
                label="Notes / Payment Terms & Conditions"
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
              {editingInvoice ? 'Save Changes' : 'Generate Invoice'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handlePaymentSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Record Payment #{selectedInvoice?.invoiceNumber}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Project: <strong>{selectedInvoice?.project?.title}</strong>
              </Typography>

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

              <TextField
                label="Payment Notes (Optional)"
                fullWidth
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
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
            Are you sure you want to delete invoice <strong>#{invoiceToDelete?.invoiceNumber}</strong>? This action cannot be undone.
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

export default InvoiceListPage;
