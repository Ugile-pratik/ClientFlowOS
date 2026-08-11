import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  useTheme
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { createClient, getClientById, updateClient } from '../../services/clientService';

const AVAILABLE_TAGS = [
  'High Value',
  'Repeat Client',
  'Corporate',
  'Startup',
  'International',
  'Priority'
];

const ClientFormPage = ({ isEdit = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  // State Management
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    gstNumber: '',
    notes: '',
    status: 'Lead',
    tags: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch client details if in Edit mode
  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!isEdit || !id) return;
      try {
        setFetching(true);
        const client = await getClientById(id);
        
        // Parse tags
        let parsedTags = [];
        if (client.tags) {
          parsedTags = Array.isArray(client.tags)
            ? client.tags
            : typeof client.tags === 'string'
            ? JSON.parse(client.tags)
            : [];
        }

        setFormData({
          company: client.company || '',
          name: client.name || '',
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
          city: client.city || '',
          state: client.state || '',
          country: client.country || '',
          postalCode: client.postalCode || '',
          gstNumber: client.gstNumber || '',
          notes: client.notes || '',
          status: client.status || 'Lead',
          tags: parsedTags
        });
      } catch (err) {
        console.error('Error fetching client details:', err);
        showSnackbar(err.message || 'Failed to fetch client details.', 'error');
      } finally {
        setFetching(false);
      }
    };

    fetchClientDetails();
  }, [id, isEdit]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Form input changes handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Tags auto-complete change handler
  const handleTagsChange = (event, value) => {
    setFormData((prev) => ({
      ...prev,
      tags: value
    }));
  };

  // Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.name.trim()) newErrors.name = 'Contact person name is required';
    
    // Email Validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Phone Validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      // Basic check for digits, spaces, plus, hyphens
      const phoneRegex = /^[\d\s+\-()]{7,15}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number (7-15 digits)';
      }
    }

    if (!formData.address.trim()) newErrors.address = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State/Province is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        // Trim standard string inputs
        company: formData.company.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        postalCode: formData.postalCode.trim(),
        gstNumber: formData.gstNumber.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (isEdit) {
        await updateClient(id, payload);
        showSnackbar('Client profile updated successfully!', 'success');
      } else {
        await createClient(payload);
        showSnackbar('Client profile added successfully!', 'success');
      }

      // Redirect back after short delay to show success snackbar
      setTimeout(() => {
        navigate('/clients');
      }, 1000);
    } catch (err) {
      console.error('Error saving client:', err);
      showSnackbar(err.message || 'Failed to save client details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Loading client data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6, maxWidth: 850, mx: 'auto' }}>
      {/* Back navigation */}
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/clients')}
        sx={{ mb: 3, color: 'text.secondary' }}
      >
        Back to Clients
      </Button>

      {/* Header Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px', mb: 0.5 }}>
          {isEdit ? 'Edit Client Profile' : 'Add New Client'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isEdit
            ? 'Update the client credentials, physical locations, and category descriptors below.'
            : 'Fill in the information below to add a new client to your CRM database.'}
        </Typography>
      </Box>

      {/* Form Card */}
      <Card
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: { xs: 3, md: 4 },
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: theme.shadows[1]
        }}
      >
        <Grid container spacing={3}>
          {/* Section 1: Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              name="company"
              label="Company Name"
              value={formData.company}
              onChange={handleChange}
              error={!!errors.company}
              helperText={errors.company}
              placeholder="e.g. Acme Corp"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              name="name"
              label="Contact Person"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="e.g. John Doe"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              placeholder="e.g. billing@company.com"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              name="phone"
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              placeholder="e.g. +91 99999 88888"
            />
          </Grid>

          {/* Section 2: Billing & Location details */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
              Billing & Address Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleChange}
              error={!!errors.address}
              helperText={errors.address}
              placeholder="e.g. Flat/Office No, Street Road, Building Name"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              required
              fullWidth
              name="city"
              label="City"
              value={formData.city}
              onChange={handleChange}
              error={!!errors.city}
              helperText={errors.city}
              placeholder="e.g. Mumbai"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              required
              fullWidth
              name="state"
              label="State / Province"
              value={formData.state}
              onChange={handleChange}
              error={!!errors.state}
              helperText={errors.state}
              placeholder="e.g. Maharashtra"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              required
              fullWidth
              name="postalCode"
              label="Postal Code"
              value={formData.postalCode}
              onChange={handleChange}
              error={!!errors.postalCode}
              helperText={errors.postalCode}
              placeholder="e.g. 400001"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              required
              fullWidth
              name="country"
              label="Country"
              value={formData.country}
              onChange={handleChange}
              error={!!errors.country}
              helperText={errors.country}
              placeholder="e.g. India"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="gstNumber"
              label="GST Number (Optional)"
              value={formData.gstNumber}
              onChange={handleChange}
              placeholder="e.g. 27AAAAA1111A1Z1"
            />
          </Grid>

          {/* Section 3: CRM Meta Info */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
              Classification & Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                id="status-select"
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleChange}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Lead">Lead</MenuItem>
                <MenuItem value="Blocked">Blocked</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              multiple
              id="tags-autocomplete"
              options={AVAILABLE_TAGS}
              value={formData.tags}
              onChange={handleTagsChange}
              freeSolo
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    color="primary"
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Client Tags"
                  placeholder="Select or enter custom tags"
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              name="notes"
              label="Client Notes (Optional)"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add payment terms, preferences, communication schedule, or critical notes..."
            />
          </Grid>

          {/* Form Actions */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<CancelIcon />}
              onClick={() => navigate('/clients')}
              disabled={loading}
              sx={{ px: 3 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              disabled={loading}
              sx={{ px: 4 }}
            >
              {loading ? 'Saving...' : 'Save Client'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Notification snackbar */}
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

export default ClientFormPage;
