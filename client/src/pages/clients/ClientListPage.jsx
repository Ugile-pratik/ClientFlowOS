import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
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
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Business as CompanyIcon,
  Person as ContactIcon,
  Mail as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { getClients, deleteClient } from '../../services/clientService';

const ClientListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State Management
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Notifications state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch clients from service
  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.q = searchQuery;

      const data = await getClients(params);
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      showSnackbar(err.message || 'Failed to fetch clients.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input to avoid hitting database on every keystroke
    const handler = setTimeout(() => {
      fetchClients();
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, statusFilter]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Delete handlers
  const openDeleteDialog = (client, e) => {
    e.stopPropagation();
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      setDeleting(true);
      await deleteClient(clientToDelete.id);
      showSnackbar('Client deleted successfully!', 'success');
      // Refresh list
      setClients(clients.filter(c => c.id !== clientToDelete.id));
    } catch (err) {
      console.error('Error deleting client:', err);
      showSnackbar(err.message || 'Failed to delete client.', 'error');
    } finally {
      setDeleting(false);
      closeDeleteDialog();
    }
  };

  // Helper to color-code status badges
  const getStatusDetails = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { color: 'success', label: 'Active' };
      case 'inactive':
        return { color: 'default', label: 'Inactive' };
      case 'lead':
        return { color: 'info', label: 'Lead' };
      case 'blocked':
        return { color: 'error', label: 'Blocked' };
      default:
        return { color: 'default', label: status };
    }
  };

  // Helper to color tags
  const getTagColor = (tag) => {
    const tagsLower = tag.toLowerCase();
    if (tagsLower.includes('high') || tagsLower.includes('priority')) return 'error';
    if (tagsLower.includes('repeat') || tagsLower.includes('corp')) return 'primary';
    if (tagsLower.includes('start')) return 'warning';
    return 'default';
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* 1. Header Area */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 4
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px', mb: 0.5 }}>
            Clients
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your client accounts, view details, and track statuses.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/clients/new')}
          sx={{ py: 1, px: 2.5 }}
        >
          Add Client
        </Button>
      </Box>

      {/* 2. Filters Grid */}
      <Card sx={{ p: 2, mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search by company, contact name or email..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: '280px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            )
          }}
        />

        <FormControl size="small" sx={{ minWidth: 160, width: { xs: '100%', sm: 'auto' } }}>
          <InputLabel id="status-filter-label">Filter Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={statusFilter}
            label="Filter Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
            <MenuItem value="Lead">Lead</MenuItem>
            <MenuItem value="Blocked">Blocked</MenuItem>
          </Select>
        </FormControl>

        {(searchQuery || statusFilter) && (
          <Button
            size="small"
            color="secondary"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </Card>

      {/* 3. Clients Card Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} />
        </Box>
      ) : clients.length === 0 ? (
        // Empty State Design
        <Card
          sx={{
            py: 8,
            px: 4,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: 'background.default'
          }}
        >
          <Avatar
            sx={{
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              color: 'text.secondary',
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 2.5
            }}
          >
            <CompanyIcon fontSize="large" />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            No Clients Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mb: 3.5 }}>
            {searchQuery || statusFilter
              ? "We couldn't find any clients matching your filter criteria. Try clearing filters or refining your query."
              : "Get started by adding your very first client profile to organize your projects and generate invoices."}
          </Typography>
          {!searchQuery && !statusFilter && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/clients/new')}
            >
              Add Your First Client
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={3}>
          {clients.map((client) => {
            const statusInfo = getStatusDetails(client.status);
            const parsedTags = Array.isArray(client.tags)
              ? client.tags
              : typeof client.tags === 'string'
              ? JSON.parse(client.tags || '[]')
              : [];

            return (
              <Grid item xs={12} sm={6} md={4} key={client.id}>
                <Card
                  onClick={() => navigate(`/clients/${client.id}`)}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 2,
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  <Box>
                    {/* Badge status on top-right */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                          color: 'primary.main',
                          width: 48,
                          height: 48,
                          borderRadius: 2
                        }}
                      >
                        {client.company ? client.company.substring(0, 2).toUpperCase() : client.name.substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Chip
                        label={statusInfo.label}
                        size="small"
                        color={statusInfo.color}
                        variant="soft"
                        sx={{ fontWeight: 700, fontSize: '0.725rem', height: 22 }}
                      />
                    </Box>

                    {/* Company and Contact details */}
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1.2 }}>
                      {client.company || 'Private Practice'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ContactIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {client.name}
                      </Typography>
                    </Box>

                    {/* Tags List */}
                    {parsedTags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
                        {parsedTags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            color={getTagColor(tag)}
                            variant="outlined"
                            sx={{ fontSize: '0.675rem', height: 18, fontWeight: 600 }}
                          />
                        ))}
                      </Box>
                    )}

                    {/* Details list */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {client.email}
                        </Typography>
                      </Box>
                      {client.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {client.phone}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DateIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Added: {new Date(client.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Actions buttons */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      pt: 2,
                      mt: 'auto'
                    }}
                    onClick={(e) => e.stopPropagation()} // Prevent card navigation
                  >
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/clients/${client.id}`)}
                      sx={{ fontSize: '0.775rem' }}
                    >
                      View
                    </Button>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit client">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/clients/${client.id}/edit`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete client">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => openDeleteDialog(client, e)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* 4. Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: { borderRadius: 3, p: 1, maxWidth: 400 }
        }}
      >
        <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 800, pb: 1 }}>
          Delete Client?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description" sx={{ fontSize: '0.925rem', color: 'text.secondary' }}>
            This action cannot be undone. All project details, invoices, and metrics linked to this client will be affected.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog} disabled={deleting} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            color="error"
            variant="contained"
            autoFocus
            startIcon={deleting && <CircularProgress size={16} color="inherit" />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* 5. Notification Snackbar */}
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

export default ClientListPage;
