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
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GridView as GridViewIcon,
  TableRows as TableViewIcon,
  FolderSpecial as ProjectIcon,
  Person as ClientIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as DateIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  AssignmentTurnedIn as CompletedIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { getProjects, createProject, updateProject, deleteProject } from '../../services/projectService';
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

const ProjectListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal State for Add / Edit
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    budget: '',
    dueDate: '',
    status: 'In Progress'
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'All') params.status = statusFilter;
      if (clientFilter) params.clientId = clientFilter;
      if (searchQuery) params.q = searchQuery;

      const [projectsData, clientsData] = await Promise.all([
        getProjects(params),
        getClients()
      ]);

      setProjects(projectsData || []);
      setClients(clientsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      showSnackbar(err.message || 'Failed to load projects data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, statusFilter, clientFilter]);

  // Compute Metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => ['In Progress', 'Planning', 'In Review'].includes(p.status)).length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

  // Form Handlers
  const handleOpenAddDialog = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      clientId: clients.length > 0 ? clients[0].id : '',
      budget: '',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'In Progress'
    });
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
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
        client: selectedClient ? { id: selectedClient.id, name: selectedClient.name, company: selectedClient.company } : undefined
      };

      if (editingProject) {
        await updateProject(editingProject.id, payload);
        showSnackbar('Project updated successfully.');
      } else {
        await createProject(payload);
        showSnackbar('Project created successfully.');
      }

      setFormDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving project:', err);
      showSnackbar(err.message || 'Failed to save project.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handlers
  const handleOpenDeleteDialog = (project, e) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const ConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setDeleting(true);
      await deleteProject(projectToDelete.id);
      showSnackbar('Project deleted successfully.');
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting project:', err);
      showSnackbar(err.message || 'Failed to delete project.', 'error');
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
            Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your project workflows, client assignments, budgets, and milestones.
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
          New Project
        </Button>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', p: 0.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.light + '25', color: theme.palette.primary.main, width: 48, height: 48 }}>
                <ProjectIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Projects
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {totalProjects}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', p: 0.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.info.light + '25', color: theme.palette.info.main, width: 48, height: 48 }}>
                <PendingIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Active Projects
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'info.main' }}>
                  {activeProjects}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', p: 0.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.success.light + '25', color: theme.palette.success.main, width: 48, height: 48 }}>
                <CompletedIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Completed
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main' }}>
                  {completedProjects}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', p: 0.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.warning.light + '25', color: theme.palette.warning.dark, width: 48, height: 48 }}>
                <MoneyIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Budget Value
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {formatCurrency(totalBudget)}
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
              placeholder="Search by title, client..."
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
                <MenuItem value="Planning">Planning</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="In Review">In Review</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Client</InputLabel>
              <Select
                value={clientFilter}
                label="Filter by Client"
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <MenuItem value="">All Clients</MenuItem>
                {clients.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.company || 'N/A'})
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
      ) : projects.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <ProjectIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No projects found
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            {searchQuery || statusFilter !== 'All' || clientFilter
              ? 'Try resetting your search filters or create a new project.'
              : 'Get started by adding your first client project.'}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog}>
            Create Project
          </Button>
        </Paper>
      ) : viewMode === 'grid' ? (
        /* Grid Card View */
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 3px 12px rgba(0,0,0,0.05)',
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
                  {/* Status & Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Chip
                      label={project.status}
                      color={STATUS_COLORS[project.status] || 'default'}
                      size="small"
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                    <Box>
                      <IconButton size="small" onClick={(e) => handleOpenEditDialog(project, e)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={(e) => handleOpenDeleteDialog(project, e)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Title */}
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
                    {project.title}
                  </Typography>

                  {/* Client Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ClientIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {project.client?.name || 'Unassigned'}
                      {project.client?.company ? ` (${project.client.company})` : ''}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Budget & Due Date */}
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Budget
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.dark' }}>
                        {formatCurrency(project.budget)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Due Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DateIcon fontSize="inherit" color="action" />
                        {formatDate(project.dueDate)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        /* Table View */
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Project Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Budget</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{project.title}</TableCell>
                  <TableCell>
                    {project.client?.name || 'Unassigned'}
                    {project.client?.company && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {project.client.company}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.status}
                      color={STATUS_COLORS[project.status] || 'default'}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'success.dark' }}>
                    {formatCurrency(project.budget)}
                  </TableCell>
                  <TableCell>{formatDate(project.dueDate)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleOpenEditDialog(project, e)} color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => handleOpenDeleteDialog(project, e)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add / Edit Project Dialog */}
      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                label="Project Title"
                fullWidth
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Website Redesign & Branding"
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
              {editingProject ? 'Save Changes' : 'Create Project'}
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
            Are you sure you want to delete <strong>{projectToDelete?.title}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={ConfirmDelete} color="error" variant="contained" disabled={deleting}>
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

export default ProjectListPage;
