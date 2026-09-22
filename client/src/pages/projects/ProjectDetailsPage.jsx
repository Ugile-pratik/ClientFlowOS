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
  Add as AddIcon,
  CheckCircle as CompletedIcon,
  HourglassEmpty as PendingIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { getProjectById, updateProject, deleteProject } from '../../services/projectService';
import { getClients } from '../../services/clientService';

const STATUS_COLORS = {
  'Planning': 'warning',
  'In Progress': 'info',
  'In Review': 'secondary',
  'Completed': 'success',
  'On Hold': 'default',
  'Proposal': 'primary',
  'Cancelled': 'error'
};

const ProjectDetailsPage = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [project, setProject] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Form Dialog State
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    budget: '',
    dueDate: '',
    status: 'In Progress'
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog State
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

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const [projectData, clientsData] = await Promise.all([
        getProjectById(id),
        getClients()
      ]);
      setProject(projectData);
      setClients(clientsData || []);
    } catch (err) {
      console.error('Error fetching project details:', err);
      showSnackbar(err.message || 'Failed to load project details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  // Edit Handlers
  const handleOpenEditDialog = () => {
    if (!project) return;
    setFormData({
      title: project.title,
      clientId: project.clientId || project.client?.id || '',
      budget: project.budget,
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
      status: project.status || 'In Progress'
    });
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showSnackbar('Project Title is required.', 'error');
      return;
    }
    if (!formData.clientId) {
      showSnackbar('Please select a Client.', 'error');
      return;
    }
    if (!formData.budget || isNaN(formData.budget) || Number(formData.budget) < 0) {
      showSnackbar('Please enter a valid budget amount.', 'error');
      return;
    }
    if (!formData.dueDate) {
      showSnackbar('Due Date is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const selectedClient = clients.find(c => c.id === parseInt(formData.clientId, 10));

      const payload = {
        ...formData,
        clientId: parseInt(formData.clientId, 10),
        budget: parseFloat(formData.budget),
        client: selectedClient ? { id: selectedClient.id, name: selectedClient.name, company: selectedClient.company } : project.client
      };

      const updated = await updateProject(id, payload);
      setProject(updated);
      showSnackbar('Project updated successfully.');
      setFormDialogOpen(false);
    } catch (err) {
      console.error('Error updating project:', err);
      showSnackbar(err.message || 'Failed to update project.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteProject(id);
      showSnackbar('Project deleted successfully.');
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      showSnackbar(err.message || 'Failed to delete project.', 'error');
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

  const getDaysRemaining = (dueDateStr) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Paper sx={{ p: 5, maxWidth: 500, margin: '0 auto', borderRadius: 3 }}>
          <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: 700 }}>
            Project Not Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The project you are looking for does not exist or has been removed.
          </Typography>
          <Button variant="contained" component={Link} to="/projects" startIcon={<BackIcon />}>
            Back to Projects
          </Button>
        </Paper>
      </Box>
    );
  }

  // Financial Calculations
  const invoices = project.invoices || [];
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const totalPaid = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const remainingBalance = Math.max(0, project.budget - totalInvoiced);
  const billingProgress = project.budget > 0 ? Math.min(100, Math.round((totalInvoiced / project.budget) * 100)) : 0;
  const daysRemaining = getDaysRemaining(project.dueDate);

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Navigation Breadcrumb */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Button
            component={Link}
            to="/projects"
            startIcon={<BackIcon />}
            sx={{ textTransform: 'none', fontWeight: 600, px: 0 }}
            color="inherit"
          >
            Projects
          </Button>
          <Typography color="text.primary" sx={{ fontWeight: 700 }}>
            {project.title}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Main Header Banner */}
      <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, mb: 4, boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                label={project.status}
                color={STATUS_COLORS[project.status] || 'default'}
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              />
              {daysRemaining !== null && (
                <Chip
                  icon={daysRemaining < 0 ? <WarningIcon fontSize="small" /> : <PendingIcon fontSize="small" />}
                  label={
                    project.status === 'Completed'
                      ? 'Completed'
                      : daysRemaining < 0
                      ? `Overdue by ${Math.abs(daysRemaining)} days`
                      : daysRemaining === 0
                      ? 'Due Today'
                      : `${daysRemaining} days remaining`
                  }
                  color={project.status === 'Completed' ? 'success' : daysRemaining < 0 ? 'error' : daysRemaining <= 3 ? 'warning' : 'default'}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
              {project.title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleOpenEditDialog} sx={{ borderRadius: 2, fontWeight: 700 }}>
              Edit Project
            </Button>
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteDialogOpen(true)} sx={{ borderRadius: 2, fontWeight: 700 }}>
              Delete
            </Button>
            <Button variant="contained" color="primary" startIcon={<InvoiceIcon />} component={Link} to="/invoices" sx={{ borderRadius: 2, fontWeight: 700 }}>
              Generate Invoice
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Grid Layout */}
      <Grid container spacing={3}>
        {/* Left Column: Project Overview & Invoices */}
        <Grid item xs={12} md={8}>
          {/* Key Metrics Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ borderRadius: 3, p: 1, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Budget
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.dark', mt: 0.5 }}>
                    {formatCurrency(project.budget)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ borderRadius: 3, p: 1, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Invoiced Amount
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {formatCurrency(totalInvoiced)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ borderRadius: 3, p: 1, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Remaining Unbilled
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: remainingBalance > 0 ? 'warning.dark' : 'text.secondary', mt: 0.5 }}>
                    {formatCurrency(remainingBalance)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Billing Progress Card */}
          <Card sx={{ borderRadius: 3, p: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Billing & Invoicing Progress
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {billingProgress}% Invoiced
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={billingProgress} sx={{ height: 10, borderRadius: 5, mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(totalInvoiced)} invoiced out of total {formatCurrency(project.budget)} budget.
            </Typography>
          </Card>

          {/* Linked Invoices Section */}
          <Card sx={{ borderRadius: 3, p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Project Invoices
              </Typography>
              <Button size="small" variant="text" startIcon={<AddIcon />} component={Link} to="/invoices">
                New Invoice
              </Button>
            </Box>

            {invoices.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', bgcolor: theme.palette.action.hover, borderRadius: 2 }}>
                <InvoiceIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No invoices generated for this project yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Invoice ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>#INV-{inv.id}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{formatCurrency(inv.amount)}</TableCell>
                        <TableCell>
                          <Chip
                            label={inv.status}
                            color={inv.status === 'Paid' ? 'success' : inv.status === 'Overdue' ? 'error' : 'warning'}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Right Column: Client & Timeline Details */}
        <Grid item xs={12} md={4}>
          {/* Client Info Card */}
          <Card sx={{ borderRadius: 3, p: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Assigned Client
            </Typography>
            {project.client ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, fontWeight: 700 }}>
                    {project.client.name ? project.client.name.charAt(0).toUpperCase() : 'C'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {project.client.name}
                    </Typography>
                    {project.client.company && (
                      <Typography variant="body2" color="text.secondary">
                        {project.client.company}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {project.client.email || 'N/A'}
                    </Typography>
                  </Box>
                  {project.client.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {project.client.phone}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  component={Link}
                  to={`/clients/${project.client.id}`}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  View Client Profile
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No client associated with this project.
              </Typography>
            )}
          </Card>

          {/* Timeline Details Card */}
          <Card sx={{ borderRadius: 3, p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Project Schedule
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.action.selected, color: 'text.primary', width: 40, height: 40 }}>
                  <DateIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Target Due Date
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatDate(project.dueDate)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.action.selected, color: 'text.primary', width: 40, height: 40 }}>
                  <DateIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Date Created
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatDate(project.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Project Dialog */}
      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>Edit Project</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                label="Project Title"
                fullWidth
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              <FormControl fullWidth required>
                <InputLabel>Client</InputLabel>
                <Select
                  value={formData.clientId}
                  label="Client"
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name} {client.company ? `(${client.company})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Budget (₹)"
                    type="number"
                    fullWidth
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
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

              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Planning">Planning</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="In Review">In Review</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="On Hold">On Hold</MenuItem>
                </Select>
              </FormControl>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Delete Project
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{project.title}</strong>? This action cannot be undone.
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

      {/* Notification Snackbar */}
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

export default ProjectDetailsPage;
