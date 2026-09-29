import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Avatar,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Language as WebsiteIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Business as BusinessIcon,
  QrCode as QrCodeIcon,
  UploadFile as UploadFileIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  AttachMoney as RateIcon,
  Star as ExperienceIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { getProfile, updateProfile, uploadQrImage } from '../../services/profileService';
import { generateUpiUri } from '../../utils/upiQr';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Form State for Edit Profile Modal
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    location: '',
    profession: '',
    bio: '',
    skills: [],
    experienceLevel: 'Intermediate',
    hourlyRate: '',
    website: '',
    linkedIn: '',
    github: '',

    // Business & Payment Information
    businessName: '',
    businessType: 'Individual / Freelancer',
    gstNumber: '',
    businessAddress: '',
    upiId: '',
    paymentQrUrl: '',
    paymentInstructions: ''
  });

  const [newSkillInput, setNewSkillInput] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      showSnackbar('Failed to load profile details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenEditModal = () => {
    if (!profile) return;
    let parsedSkills = [];
    if (profile.skills) {
      parsedSkills = Array.isArray(profile.skills)
        ? profile.skills
        : typeof profile.skills === 'string'
        ? JSON.parse(profile.skills)
        : [];
    }

    setFormData({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      location: profile.location || '',
      profession: profile.profession || 'Freelancer / Software Developer',
      bio: profile.bio || '',
      skills: parsedSkills,
      experienceLevel: profile.experienceLevel || 'Intermediate',
      hourlyRate: profile.hourlyRate || '',
      website: profile.website || '',
      linkedIn: profile.linkedIn || '',
      github: profile.github || '',

      businessName: profile.businessName || '',
      businessType: profile.businessType || 'Individual / Freelancer',
      gstNumber: profile.gstNumber || '',
      businessAddress: profile.businessAddress || '',
      upiId: profile.upiId || '',
      paymentQrUrl: profile.paymentQrUrl || '',
      paymentInstructions: profile.paymentInstructions || ''
    });
    setEditModalOpen(true);
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, trimmed]
      }));
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
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
      showSnackbar('Payment QR image uploaded successfully!', 'success');
    } catch (err) {
      console.error('QR upload error:', err);
      showSnackbar('Failed to upload QR image.', 'error');
    } finally {
      setUploadingQr(false);
      e.target.value = null;
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        profession: formData.profession.trim(),
        bio: formData.bio.trim(),
        skills: formData.skills,
        experienceLevel: formData.experienceLevel,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        website: formData.website.trim(),
        linkedIn: formData.linkedIn.trim(),
        github: formData.github.trim(),

        businessName: formData.businessName.trim(),
        businessType: formData.businessType,
        gstNumber: formData.gstNumber.trim(),
        businessAddress: formData.businessAddress.trim(),
        upiId: formData.upiId.trim(),
        paymentQrUrl: formData.paymentQrUrl,
        paymentInstructions: formData.paymentInstructions.trim()
      });
      setProfile(updated);
      showSnackbar('Profile details updated successfully!', 'success');
      setEditModalOpen(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      showSnackbar(err.response?.data?.error || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  const skillsList = Array.isArray(profile?.skills)
    ? profile.skills
    : typeof profile?.skills === 'string'
    ? JSON.parse(profile.skills)
    : ['React', 'JavaScript', 'Node.js', 'SQL', 'UI/UX'];

  const upiUri = generateUpiUri({
    upiId: profile?.upiId,
    payeeName: profile?.businessName || profile?.fullName,
    amount: '5000',
    invoiceNumber: 'INV-SAMPLE'
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 1. Header Profile Banner */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 3 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              fontSize: '2.5rem',
              bgcolor: 'primary.main',
              border: '4px solid rgba(255,255,255,0.2)'
            }}
          >
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P'}
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight="800" gutterBottom>
              {profile?.fullName || 'Freelancer Professional'}
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkIcon fontSize="small" /> {profile?.profession || 'Freelancer / Software Developer'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationIcon fontSize="small" /> {profile?.location || 'Pune, India'}
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleOpenEditModal}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            Edit Profile
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            {/* Personal Information */}
            <Card elevation={2} sx={{ borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="700" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" /> Personal Information
                  </Typography>
                  <Button size="small" startIcon={<EditIcon />} onClick={handleOpenEditModal}>
                    Edit
                  </Button>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">FULL NAME</Typography>
                    <Typography variant="body1" fontWeight="600">{profile?.fullName || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">EMAIL ADDRESS</Typography>
                    <Typography variant="body1" fontWeight="600">{profile?.email || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">PHONE NUMBER</Typography>
                    <Typography variant="body1" fontWeight="600">{profile?.phone || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">LOCATION</Typography>
                    <Typography variant="body1" fontWeight="600">{profile?.location || 'Pune, India'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* About Me */}
            <Card elevation={2} sx={{ borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="700" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon color="primary" /> About Me
                  </Typography>
                  <Button size="small" startIcon={<EditIcon />} onClick={handleOpenEditModal}>
                    Edit
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, whitespace: 'pre-line' }}>
                  {profile?.bio ||
                    'Software developer specializing in web applications, client solutions, and business process automation. Passionate about building clean, performant, user-friendly digital products.'}
                </Typography>
              </CardContent>
            </Card>

            {/* Business Summary & Payment QR Details */}
            <Card elevation={2} sx={{ borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="700" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon color="primary" /> Business Summary & Payment Settings
                  </Typography>
                  <Button size="small" startIcon={<EditIcon />} onClick={handleOpenEditModal}>
                    Edit
                  </Button>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">BUSINESS NAME</Typography>
                    <Typography variant="body1" fontWeight="600">{profile?.businessName || profile?.fullName || 'Independent Professional'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">BUSINESS TYPE</Typography>
                    <Typography variant="body1" fontWeight="600">{profile?.businessType || 'Freelancer / Individual'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">GST / TAX NUMBER</Typography>
                    <Typography variant="body1" fontWeight="600">{profile?.gstNumber || 'Not Registered'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">UPI ID (VPA)</Typography>
                    <Typography variant="body1" fontWeight="600" color="primary.main">
                      {profile?.upiId || 'Not Configured'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">BUSINESS ADDRESS</Typography>
                    <Typography variant="body1" fontWeight="600">{profile?.businessAddress || 'Not Provided'}</Typography>
                  </Grid>
                </Grid>

                {/* Scannable Payment QR Preview Box */}
                <Box sx={{ mt: 3, p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon color="primary" fontSize="small" /> Invoice Payment QR Code & Instructions
                  </Typography>
                  <Grid container spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                    <Grid item xs={12} sm={8}>
                      {profile?.paymentInstructions ? (
                        <Typography variant="body2" color="text.secondary" sx={{ whitespace: 'pre-line' }}>
                          {profile.paymentInstructions}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No payment instructions added yet. Edit your business summary to add bank or UPI details for invoices.
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
                      {profile?.paymentQrUrl ? (
                        <Box
                          component="img"
                          src={profile.paymentQrUrl}
                          alt="Payment QR"
                          sx={{ width: 110, height: 110, objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: 1.5, p: 0.5, bgcolor: '#ffffff' }}
                        />
                      ) : profile?.upiId ? (
                        <Box sx={{ display: 'inline-block', p: 1, bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #cbd5e1' }}>
                          <QRCodeSVG value={upiUri} size={100} level="H" includeMargin={true} />
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Add UPI ID to generate scannable payment QR
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            {/* Professional Information */}
            <Card elevation={2} sx={{ borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="700" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ExperienceIcon color="primary" /> Professional Details
                  </Typography>
                  <Button size="small" startIcon={<EditIcon />} onClick={handleOpenEditModal}>
                    Edit
                  </Button>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">EXPERIENCE LEVEL</Typography>
                    <Typography variant="body1" fontWeight="700" color="primary.main">
                      {profile?.experienceLevel || 'Intermediate / Professional'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">HOURLY RATE</Typography>
                    <Typography variant="body1" fontWeight="700">
                      {profile?.hourlyRate ? `₹${profile.hourlyRate} / hour` : '₹1,500 / hour'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
                      SKILLS & EXPERTISE
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {skillsList.map((skill, index) => (
                        <Chip key={index} label={skill} color="primary" variant="outlined" size="small" fontWeight="600" />
                      ))}
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Online Presence */}
            <Card elevation={2} sx={{ borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="700" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WebsiteIcon color="primary" /> Online Presence
                  </Typography>
                  <Button size="small" startIcon={<EditIcon />} onClick={handleOpenEditModal}>
                    Edit
                  </Button>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <WebsiteIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="600">PORTFOLIO / WEBSITE</Typography>
                      <Typography variant="body2" fontWeight="600">
                        {profile?.website ? (
                          <a href={profile.website} target="_blank" rel="noreferrer" style={{ color: '#1976d2', textDecoration: 'none' }}>
                            {profile.website}
                          </a>
                        ) : (
                          'Not added'
                        )}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <LinkedInIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="600">LINKEDIN</Typography>
                      <Typography variant="body2" fontWeight="600">
                        {profile?.linkedIn ? (
                          <a href={profile.linkedIn} target="_blank" rel="noreferrer" style={{ color: '#1976d2', textDecoration: 'none' }}>
                            {profile.linkedIn}
                          </a>
                        ) : (
                          'Not added'
                        )}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <GitHubIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="600">GITHUB</Typography>
                      <Typography variant="body2" fontWeight="600">
                        {profile?.github ? (
                          <a href={profile.github} target="_blank" rel="noreferrer" style={{ color: '#1976d2', textDecoration: 'none' }}>
                            {profile.github}
                          </a>
                        ) : (
                          'Not added'
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* 2. Edit Profile Modal Dialog */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSaveProfile}>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Edit Professional Profile & Business Details
            <IconButton onClick={() => setEditModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3} sx={{ pt: 1 }}>
              <Typography variant="subtitle2" fontWeight="700" color="primary">
                PERSONAL INFORMATION
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location / City"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Pune, India"
                  />
                </Grid>
              </Grid>

              <Divider />

              <Typography variant="subtitle2" fontWeight="700" color="primary">
                BUSINESS & PAYMENT QR SETTINGS
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Pratik Digital Services"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Business Type</InputLabel>
                    <Select
                      value={formData.businessType}
                      label="Business Type"
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
                    label="GST / Tax ID Number"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="UPI ID (VPA)"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="e.g. pratik@upi or 9876543210@okicici"
                    helperText="Generates scannable QR code on generated client invoices."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Business Address"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Payment Instructions for Invoices"
                    value={formData.paymentInstructions}
                    onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                    placeholder="e.g. Please mention invoice number in UPI payment note."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={uploadingQr ? <CircularProgress size={18} /> : <UploadFileIcon />}
                    disabled={uploadingQr}
                  >
                    {uploadingQr ? 'Uploading...' : formData.paymentQrUrl ? 'Replace Custom QR Image' : 'Upload Custom QR Image'}
                    <input type="file" hidden accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileUpload} />
                  </Button>
                </Grid>
              </Grid>

              <Divider />

              <Typography variant="subtitle2" fontWeight="700" color="primary">
                PROFESSIONAL INFORMATION
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Profession / Title"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    placeholder="Software Developer / UI Consultant"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Hourly Rate (₹)"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="About Me / Bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell clients about your expertise, experience, and background..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" fontWeight="600" color="text.secondary" gutterBottom display="block">
                    SKILLS & EXPERTISE
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                    <TextField
                      size="small"
                      placeholder="Add a skill (e.g. React, Python)"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <Button variant="outlined" size="small" onClick={handleAddSkill} startIcon={<AddIcon />}>
                      Add
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.skills.map((skill, idx) => (
                      <Chip key={idx} label={skill} onDelete={() => handleRemoveSkill(skill)} color="primary" size="small" />
                    ))}
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              <Typography variant="subtitle2" fontWeight="700" color="primary">
                ONLINE PRESENCE
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Website / Portfolio"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://myportfolio.com"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="LinkedIn Profile"
                    value={formData.linkedIn}
                    onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="GitHub Profile"
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    placeholder="https://github.com/username"
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setEditModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Profile Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Notifications Snackbar */}
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

export default ProfilePage;
