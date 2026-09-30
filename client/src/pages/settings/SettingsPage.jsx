import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
  Dialog,
  Zoom,
  IconButton,
  Avatar
} from '@mui/material';
import {
  Business as BusinessIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PreferencesIcon,
  QrCode as QrCodeIcon,
  UploadFile as UploadFileIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Receipt as InvoiceIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { getSettings, updateSettings, changePassword } from '../../services/settingsService';
import { uploadAvatarImage, uploadBannerImage, uploadQrImage } from '../../services/profileService';
import { generateUpiUri } from '../../utils/upiQr';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`settings-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const SettingsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrZoomOpen, setQrZoomOpen] = useState(false);

  // Settings State
  const [formData, setFormData] = useState({
    // Business Profile & Media
    profilePhotoUrl: '',
    coverBannerUrl: '',
    businessName: '',
    businessType: 'Individual / Freelancer',
    gstNumber: '',
    businessAddress: '',
    businessDescription: '',

    // Payment & Invoicing
    upiId: '',
    paymentQrUrl: '',
    paymentInstructions: '',
    invoicePrefix: 'INV',
    nextInvoiceNumber: 1,
    defaultCurrency: 'INR',
    defaultTaxRate: 0,
    defaultPaymentTerms: 'Due within 15 days',
    defaultNotes: 'Thank you for your business!',
    showAddressOnInvoice: true,
    showPhoneOnInvoice: true,
    showEmailOnInvoice: true,
    showWebsiteOnInvoice: true,

    // Security & Preferences & Notifications
    theme: 'system',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'Asia/Kolkata',
    notifyProjectDeadlines: true,
    notifyInvoiceDue: true,
    notifyPaymentReceived: true,
    notifyAiInsights: true,

    // Meta
    fullName: '',
    email: '',
    isVerified: true
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp)$/i)) {
      showSnackbar('Only PNG, JPG, JPEG, and WEBP images are allowed.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('File size exceeds 5MB limit.', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await uploadAvatarImage(file);
      setFormData(prev => ({ ...prev, profilePhotoUrl: res.profilePhotoUrl }));
      showSnackbar('Profile picture updated successfully!', 'success');
    } catch (err) {
      console.error('Avatar upload error:', err);
      showSnackbar('Failed to upload profile picture.', 'error');
    } finally {
      setUploadingAvatar(false);
      e.target.value = null;
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp)$/i)) {
      showSnackbar('Only PNG, JPG, JPEG, and WEBP images are allowed.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('File size exceeds 5MB limit.', 'error');
      return;
    }

    setUploadingBanner(true);
    try {
      const res = await uploadBannerImage(file);
      setFormData(prev => ({ ...prev, coverBannerUrl: res.coverBannerUrl }));
      showSnackbar('Cover banner updated successfully!', 'success');
    } catch (err) {
      console.error('Banner upload error:', err);
      showSnackbar('Failed to upload cover banner.', 'error');
    } finally {
      setUploadingBanner(false);
      e.target.value = null;
    }
  };

  const fetchSettingsData = async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setFormData({
        businessName: data.businessName || '',
        businessType: data.businessType || 'Individual / Freelancer',
        gstNumber: data.gstNumber || '',
        businessAddress: data.businessAddress || '',
        businessDescription: data.businessDescription || '',
        upiId: data.upiId || '',
        paymentQrUrl: data.paymentQrUrl || '',
        paymentInstructions: data.paymentInstructions || '',
        invoicePrefix: data.invoicePrefix || 'INV',
        nextInvoiceNumber: data.nextInvoiceNumber || 1,
        defaultCurrency: data.defaultCurrency || 'INR',
        defaultTaxRate: data.defaultTaxRate !== undefined ? data.defaultTaxRate : 0,
        defaultPaymentTerms: data.defaultPaymentTerms || 'Due within 15 days',
        defaultNotes: data.defaultNotes || 'Thank you for your business!',
        showAddressOnInvoice: data.showAddressOnInvoice !== undefined ? data.showAddressOnInvoice : true,
        showPhoneOnInvoice: data.showPhoneOnInvoice !== undefined ? data.showPhoneOnInvoice : true,
        showEmailOnInvoice: data.showEmailOnInvoice !== undefined ? data.showEmailOnInvoice : true,
        showWebsiteOnInvoice: data.showWebsiteOnInvoice !== undefined ? data.showWebsiteOnInvoice : true,
        theme: data.theme || 'system',
        dateFormat: data.dateFormat || 'DD/MM/YYYY',
        timeZone: data.timeZone || 'Asia/Kolkata',
        notifyProjectDeadlines: data.notifyProjectDeadlines !== undefined ? data.notifyProjectDeadlines : true,
        notifyInvoiceDue: data.notifyInvoiceDue !== undefined ? data.notifyInvoiceDue : true,
        notifyPaymentReceived: data.notifyPaymentReceived !== undefined ? data.notifyPaymentReceived : true,
        notifyAiInsights: data.notifyAiInsights !== undefined ? data.notifyAiInsights : true,
        fullName: data.fullName || '',
        email: data.email || '',
        isVerified: data.isVerified || false
      });
    } catch (err) {
      console.error('Error fetching settings:', err);
      showSnackbar('Failed to load settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateSettings(formData);
      showSnackbar('Settings updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating settings:', err);
      showSnackbar(err.response?.data?.error || 'Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp)$/i)) {
      showSnackbar('Only PNG, JPG, JPEG, and WEBP images are allowed.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('File size exceeds 5MB limit.', 'error');
      return;
    }

    setUploadingQr(true);
    try {
      const res = await uploadQrImage(file);
      setFormData(prev => ({ ...prev, paymentQrUrl: res.paymentQrUrl }));
      showSnackbar('Payment QR code image uploaded successfully!', 'success');
    } catch (err) {
      console.error('QR upload error:', err);
      showSnackbar('Failed to upload QR image.', 'error');
    } finally {
      setUploadingQr(false);
      e.target.value = null;
    }
  };

  const handleRemoveQr = () => {
    setFormData(prev => ({ ...prev, paymentQrUrl: '' }));
    showSnackbar('Custom QR image removed. Falling back to UPI ID QR code.', 'info');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar('New password and confirm password do not match.', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      showSnackbar('Password changed successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Password change error:', err);
      showSnackbar(err.response?.data?.error || 'Failed to change password.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  const previewUpiUri = generateUpiUri({
    upiId: formData.upiId,
    payeeName: formData.businessName || formData.fullName
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="800" gutterBottom>
          Account & Application Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure business details, payment QR codes, invoice templates, security settings, and notifications.
        </Typography>
      </Box>

      {/* Tabs Navigation Header */}
      <Paper elevation={1} sx={{ borderRadius: 2, mb: 1, bgcolor: '#ffffff' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary"
          textColor="primary"
          sx={{ px: 2 }}
        >
          <Tab icon={<BusinessIcon />} label="Business Profile" iconPosition="start" />
          <Tab icon={<PaymentIcon />} label="Payment & Invoicing" iconPosition="start" />
          <Tab icon={<SecurityIcon />} label="Security" iconPosition="start" />
          <Tab icon={<NotificationsIcon />} label="Notifications" iconPosition="start" />
          <Tab icon={<PreferencesIcon />} label="Preferences" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* 1. Business Profile Tab */}
      <TabPanel value={tabValue} index={0}>
        <Card elevation={2} sx={{ borderRadius: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BusinessIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="700">
                Business Profile Information
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This information represents your business identity on clients' invoices and formal communications.
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSaveSettings}>
              <Grid container spacing={2.5}>
                {/* Profile Media Section */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#f8fafc' }}>
                    <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhotoCameraIcon fontSize="small" /> Profile Picture & Cover Banner
                    </Typography>

                    <Grid container spacing={3} alignItems="center" sx={{ mt: 0.5 }}>
                      {/* Avatar Upload Box */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={formData.profilePhotoUrl || ''}
                            sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                          >
                            {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'P'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="700">
                              Profile Picture (Avatar)
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                              PNG, JPG, or WEBP (Max 5MB)
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              component="label"
                              startIcon={uploadingAvatar ? <CircularProgress size={16} /> : <PhotoCameraIcon />}
                              disabled={uploadingAvatar}
                            >
                              Upload Photo
                              <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                            </Button>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Cover Banner Upload Box */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 100,
                              height: 56,
                              borderRadius: 1.5,
                              overflow: 'hidden',
                              background: formData.coverBannerUrl
                                ? `url(${formData.coverBannerUrl}) center/cover no-repeat`
                                : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                              border: '1px solid #cbd5e1'
                            }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight="700">
                              Cover Banner Image
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                              Header banner for profile page
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              component="label"
                              startIcon={uploadingBanner ? <CircularProgress size={16} /> : <PhotoCameraIcon />}
                              disabled={uploadingBanner}
                            >
                              Upload Banner
                              <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                            </Button>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Business / Trading Name"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Pratik Digital Services"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Business Entity Type</InputLabel>
                    <Select
                      value={formData.businessType}
                      label="Business Entity Type"
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    >
                      <MenuItem value="Individual / Freelancer">Individual / Freelancer</MenuItem>
                      <MenuItem value="Sole Proprietorship">Sole Proprietorship</MenuItem>
                      <MenuItem value="Partnership / LLP">Partnership / LLP</MenuItem>
                      <MenuItem value="Private Limited">Private Limited</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="GSTIN / Tax ID Number (Optional)"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Registered Business Address"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    placeholder="e.g. 101 Tech Park, FC Road, Shivajinagar, Pune, Maharashtra 411005"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Business Overview / Description"
                    value={formData.businessDescription}
                    onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                    placeholder="Provide a brief overview of services your business offers..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={saving}
                  >
                    Save Business Profile
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </TabPanel>

      {/* 2. Payment & Invoicing Tab (Includes UPI QR Feature + Invoice Settings + Branding) */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Left Side: Payment Information & Invoice Settings */}
          <Grid item xs={12} md={7}>
            <Stack spacing={3}>
              {/* Payment Information Card */}
              <Card elevation={2} sx={{ borderRadius: 2.5 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PaymentIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight="700">
                      Payment Information
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure payment collection options shown on client invoices.
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="UPI ID (VPA)"
                        value={formData.upiId}
                        onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                        placeholder="e.g. pratik@upi or 9876543210@okicici"
                        helperText="Used to generate instant scannable UPI payment QR codes on invoices."
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Payment Instructions & Terms"
                        value={formData.paymentInstructions}
                        onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                        placeholder="e.g. Please mention invoice number in UPI transaction notes. Bank transfer: A/C 123456789 IFSC: HDFC0001234"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Invoice Settings Card */}
              <Card elevation={2} sx={{ borderRadius: 2.5 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InvoiceIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight="700">
                      Invoice Default Settings
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Invoice Prefix"
                        value={formData.invoicePrefix}
                        onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                        placeholder="INV"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Next Invoice Number"
                        value={formData.nextInvoiceNumber}
                        onChange={(e) => setFormData({ ...formData, nextInvoiceNumber: parseInt(e.target.value, 10) || 1 })}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Default Currency</InputLabel>
                        <Select
                          value={formData.defaultCurrency}
                          label="Default Currency"
                          onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                        >
                          <MenuItem value="INR">INR (₹)</MenuItem>
                          <MenuItem value="USD">USD ($)</MenuItem>
                          <MenuItem value="EUR">EUR (€)</MenuItem>
                          <MenuItem value="GBP">GBP (£)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Default Tax Rate (%)"
                        value={formData.defaultTaxRate}
                        onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Default Payment Terms"
                        value={formData.defaultPaymentTerms}
                        onChange={(e) => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
                        placeholder="e.g. Due within 15 days"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Default Notes / Footer"
                        value={formData.defaultNotes}
                        onChange={(e) => setFormData({ ...formData, defaultNotes: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Invoice Branding Settings Card */}
              <Card elevation={2} sx={{ borderRadius: 2.5 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="700" gutterBottom>
                    Invoice Branding & Display Options
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.showAddressOnInvoice}
                          onChange={(e) => setFormData({ ...formData, showAddressOnInvoice: e.target.checked })}
                          color="primary"
                        />
                      }
                      label="Show Business Address on Invoice"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.showPhoneOnInvoice}
                          onChange={(e) => setFormData({ ...formData, showPhoneOnInvoice: e.target.checked })}
                          color="primary"
                        />
                      }
                      label="Show Phone Number on Invoice"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.showEmailOnInvoice}
                          onChange={(e) => setFormData({ ...formData, showEmailOnInvoice: e.target.checked })}
                          color="primary"
                        />
                      }
                      label="Show Email Address on Invoice"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.showWebsiteOnInvoice}
                          onChange={(e) => setFormData({ ...formData, showWebsiteOnInvoice: e.target.checked })}
                          color="primary"
                        />
                      }
                      label="Show Portfolio / Website on Invoice"
                    />
                  </Stack>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      onClick={handleSaveSettings}
                      disabled={saving}
                    >
                      Save Payment & Invoicing Settings
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Right Side: QR Code Preview & Upload */}
          <Grid item xs={12} md={5}>
            <Card elevation={2} sx={{ borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="700" align="left" gutterBottom>
                  Payment QR Code Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" align="left" sx={{ mb: 2 }}>
                  Live scannable QR preview generated for your invoice payment footer.
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    mb: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    bgcolor: '#f8fafc',
                    borderRadius: 2
                  }}
                >
                  {formData.paymentQrUrl || (formData.upiId && formData.upiId.trim()) ? (
                    <Tooltip title="Click to enlarge QR Code" arrow>
                      <Box
                        onClick={() => setQrZoomOpen(true)}
                        sx={{
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': { transform: 'scale(1.05)' }
                        }}
                      >
                        {formData.paymentQrUrl ? (
                          <>
                            <Chip icon={<CheckCircleIcon />} label="Custom Uploaded QR" color="primary" size="small" sx={{ mb: 2 }} />
                            <Box
                              component="img"
                              src={formData.paymentQrUrl}
                              alt="Payment QR Code"
                              sx={{
                                width: 200,
                                height: 200,
                                objectFit: 'contain',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0',
                                p: 1,
                                bgcolor: '#ffffff'
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <Chip icon={<QrCodeIcon />} label="Auto-Generated UPI QR" color="success" size="small" sx={{ mb: 2 }} />
                            <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', display: 'inline-block' }}>
                              <QRCodeSVG value={previewUpiUri} size={180} level="H" includeMargin={true} />
                            </Box>
                            <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 700 }}>
                              {formData.upiId}
                            </Typography>
                          </>
                        )}
                        <Typography variant="caption" display="block" color="primary.main" sx={{ fontWeight: 600, mt: 1 }}>
                          Click to zoom
                        </Typography>
                      </Box>
                    </Tooltip>
                  ) : (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                      <QrCodeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="subtitle1" fontWeight="600" color="text.secondary">
                        No UPI ID Configured
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, px: 2 }}>
                        Enter a UPI ID on the left to generate a scannable payment QR code.
                      </Typography>
                    </Box>
                  )}
                </Paper>

                <Stack spacing={2}>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={uploadingQr ? <CircularProgress size={20} /> : <UploadFileIcon />}
                    disabled={uploadingQr}
                    fullWidth
                  >
                    {uploadingQr ? 'Uploading Image...' : formData.paymentQrUrl ? 'Replace Uploaded QR' : 'Upload Custom QR Image'}
                    <input type="file" hidden accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileUpload} />
                  </Button>

                  {formData.paymentQrUrl && (
                    <Button variant="text" color="error" size="small" startIcon={<DeleteIcon />} onClick={handleRemoveQr}>
                      Remove Custom Image
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 3. Security Tab */}
      <TabPanel value={tabValue} index={2}>
        <Stack spacing={3}>
          <Card elevation={2} sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LockIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="700">
                  Account Password & Credentials
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <form onSubmit={handlePasswordSubmit}>
                <Grid container spacing={2.5} sx={{ maxWidth: 500 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Current Password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="New Password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      helperText="Must be at least 6 characters long."
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirm New Password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={changingPassword}
                      startIcon={changingPassword ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
                    >
                      {changingPassword ? 'Updating Password...' : 'Change Password'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="700" gutterBottom>
                Account Verification & Session
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body1" fontWeight="600">Email Verification Status:</Typography>
                <Chip icon={<CheckCircleIcon />} label="Email Verified ✓" color="success" size="small" />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Logged in as: <strong>{formData.email}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </TabPanel>

      {/* 4. Notifications Tab */}
      <TabPanel value={tabValue} index={3}>
        <Card elevation={2} sx={{ borderRadius: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="700">
                Notification Preferences
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Control email and dashboard alert preferences for deadlines, payments, and AI business insights.
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifyProjectDeadlines}
                    onChange={(e) => setFormData({ ...formData, notifyProjectDeadlines: e.target.checked })}
                    color="primary"
                  />
                }
                label="Upcoming Project Deadline Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifyInvoiceDue}
                    onChange={(e) => setFormData({ ...formData, notifyInvoiceDue: e.target.checked })}
                    color="primary"
                  />
                }
                label="Invoice Payment Due Reminders"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifyPaymentReceived}
                    onChange={(e) => setFormData({ ...formData, notifyPaymentReceived: e.target.checked })}
                    color="primary"
                  />
                }
                label="Client Payment Received Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifyAiInsights}
                    onChange={(e) => setFormData({ ...formData, notifyAiInsights: e.target.checked })}
                    color="primary"
                  />
                }
                label="AI Business Insights & Recommendations"
              />
            </Stack>

            <Box sx={{ mt: 3 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={saving}>
                Save Notification Preferences
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* 5. Preferences Tab */}
      <TabPanel value={tabValue} index={4}>
        <Card elevation={2} sx={{ borderRadius: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PreferencesIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="700">
                Application Preferences
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2.5} sx={{ maxWidth: 600 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Appearance Theme</InputLabel>
                  <Select
                    value={formData.theme}
                    label="Appearance Theme"
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  >
                    <MenuItem value="system">System Default</MenuItem>
                    <MenuItem value="light">Light Theme</MenuItem>
                    <MenuItem value="dark">Dark Theme</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={formData.dateFormat}
                    label="Date Format"
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                  >
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={saving}>
                  Save Application Preferences
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* QR Lightbox Dialog */}
      <Dialog
        open={qrZoomOpen}
        onClose={() => setQrZoomOpen(false)}
        TransitionComponent={Zoom}
        keepMounted
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 3,
            textAlign: 'center',
            maxWidth: 380,
            width: '90%'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="700" color="primary">
            UPI Payment QR Code
          </Typography>
          <IconButton size="small" onClick={() => setQrZoomOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 2, display: 'inline-block', mb: 2 }}>
          {formData.paymentQrUrl ? (
            <Box
              component="img"
              src={formData.paymentQrUrl}
              alt="Enlarged Payment QR"
              sx={{ width: 250, height: 250, objectFit: 'contain' }}
            />
          ) : formData.upiId ? (
            <QRCodeSVG value={previewUpiUri} size={250} level="H" includeMargin={true} />
          ) : null}
        </Box>

        {formData.upiId && (
          <Typography variant="subtitle1" fontWeight="700" color="primary.main" gutterBottom>
            {formData.upiId}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" display="block">
          Scan with any UPI App (GPay, PhonePe, Paytm) to make payment. Click anywhere to close.
        </Typography>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SettingsPage;
