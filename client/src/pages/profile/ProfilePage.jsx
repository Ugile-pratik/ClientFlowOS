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
  MenuItem,
  Tooltip,
  Zoom
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
  Payment as PaymentIcon,
  AttachMoney as RateIcon,
  Star as ExperienceIcon,
  Add as AddIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { getProfile, updateProfile, uploadAvatarImage, uploadBannerImage, uploadQrImage } from '../../services/profileService';
import { generateUpiUri } from '../../utils/upiQr';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSection, setEditSection] = useState('all'); // 'all' | 'personal' | 'about' | 'business' | 'professional' | 'online'
  const [qrZoomOpen, setQrZoomOpen] = useState(false);

  // Form State for Edit Profile Modal
  const [formData, setFormData] = useState({
    fullName: '',
    profilePhotoUrl: '',
    coverBannerUrl: '',
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

  const handleOpenEditModal = (section = 'all') => {
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
      profilePhotoUrl: profile.profilePhotoUrl || '',
      coverBannerUrl: profile.coverBannerUrl || '',
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
    setEditSection(section);
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
      setProfile(prev => ({ ...prev, profilePhotoUrl: res.profilePhotoUrl }));
      setFormData(prev => ({ ...prev, profilePhotoUrl: res.profilePhotoUrl }));
      if (updateUser) updateUser({ profilePhotoUrl: res.profilePhotoUrl });
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
      setProfile(prev => ({ ...prev, coverBannerUrl: res.coverBannerUrl }));
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
        profilePhotoUrl: formData.profilePhotoUrl,
        coverBannerUrl: formData.coverBannerUrl,
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
      showSnackbar('Profile section updated successfully!', 'success');
      setEditModalOpen(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      showSnackbar(err.response?.data?.error || 'Failed to update profile section.', 'error');
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
    payeeName: profile?.businessName || profile?.fullName
  });

  const getModalTitle = () => {
    switch (editSection) {
      case 'personal': return 'Edit Personal Information & Photos';
      case 'about': return 'Edit About Me / Bio';
      case 'business': return 'Edit Business & Payment Settings';
      case 'professional': return 'Edit Professional Details';
      case 'online': return 'Edit Online Presence';
      default: return 'Edit Complete Professional Profile';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2.5, sm: 3, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* 1. Full Cover Background Header Profile Card */}
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2.5, sm: 3, md: 4 },
          mb: 4,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          background: profile?.coverBannerUrl
            ? `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.85)), url(${profile.coverBannerUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1e293b 0%, #3b82f6 50%, #0f172a 100%)',
          color: '#ffffff',
          transition: 'background 0.3s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
        }}
      >
        {/* Cover Banner Upload Action Button */}
        <Tooltip title="Upload Cover Banner Image" arrow>
          <Button
            component="label"
            size="small"
            variant="contained"
            startIcon={uploadingBanner ? <CircularProgress size={16} color="inherit" /> : <PhotoCameraIcon fontSize="small" />}
            sx={{
              position: 'absolute',
              top: { xs: 12, sm: 16 },
              right: { xs: 12, sm: 16 },
              bgcolor: 'rgba(15, 23, 42, 0.75)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(4px)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              borderRadius: 2,
              px: { xs: 1.5, sm: 2 },
              '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.95)' }
            }}
          >
            Change Banner
            <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
          </Button>
        </Tooltip>

        <Box sx={{ width: '100%', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 3, zIndex: 1, mt: { xs: 3, sm: 0 } }}>
          {/* Avatar with Camera Icon Badge */}
          <Box sx={{ position: 'relative', display: 'inline-block', alignSelf: { xs: 'flex-start', sm: 'center' } }}>
            <Avatar
              src={profile?.profilePhotoUrl || ''}
              sx={{
                width: { xs: 90, sm: 110 },
                height: { xs: 90, sm: 110 },
                fontSize: { xs: '2rem', sm: '2.5rem' },
                bgcolor: 'primary.main',
                border: '4px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
              }}
            >
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P'}
            </Avatar>

            <Tooltip title="Upload Profile Picture" arrow>
              <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'primary.main',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  p: 0.8,
                  border: '2px solid #ffffff',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                {uploadingAvatar ? <CircularProgress size={16} color="inherit" /> : <PhotoCameraIcon sx={{ fontSize: 16 }} />}
                <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight="800" sx={{ color: '#ffffff', letterSpacing: '-0.5px', fontSize: { xs: '1.4rem', sm: '1.85rem', md: '2.125rem' } }} gutterBottom>
              {profile?.fullName || 'Freelancer Professional'}
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.95, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              <WorkIcon fontSize="small" sx={{ color: '#60a5fa' }} /> {profile?.profession || 'Freelancer / Software Developer'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationIcon fontSize="small" sx={{ color: '#94a3b8' }} /> {profile?.location || 'Pune, India'}
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => handleOpenEditModal('all')}
            sx={{ borderRadius: 2, px: 3, py: 1.2, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
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
                  <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenEditModal('personal')}>
                    Edit Section
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
                  <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenEditModal('about')}>
                    Edit Section
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
                  <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenEditModal('business')}>
                    Edit Section
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
                <Box sx={{ mt: 3, p: 2.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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
                          No payment instructions added yet. Click Edit Section above to configure UPI or bank details.
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
                      {profile?.paymentQrUrl || profile?.upiId ? (
                        <Tooltip title="Click to enlarge QR Code" arrow>
                          <Box
                            onClick={() => setQrZoomOpen(true)}
                            sx={{
                              display: 'inline-block',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': { transform: 'scale(1.06)' }
                            }}
                          >
                            {profile.paymentQrUrl ? (
                              <Box
                                component="img"
                                src={profile.paymentQrUrl}
                                alt="Payment QR"
                                sx={{ width: 110, height: 110, objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: 1.5, p: 0.5, bgcolor: '#ffffff' }}
                              />
                            ) : (
                              <Box sx={{ display: 'inline-block', p: 1, bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #cbd5e1' }}>
                                <QRCodeSVG value={upiUri} size={100} level="H" includeMargin={true} />
                              </Box>
                            )}
                            <Typography variant="caption" display="block" color="primary.main" sx={{ fontWeight: 600, mt: 0.5 }}>
                              Click to zoom
                            </Typography>
                          </Box>
                        </Tooltip>
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
                  <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenEditModal('professional')}>
                    Edit Section
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
                  <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenEditModal('online')}>
                    Edit Section
                  </Button>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <WebsiteIcon color="action" />
                    <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight="600">PORTFOLIO / WEBSITE</Typography>
                      <Typography variant="body2" fontWeight="600" sx={{ wordBreak: 'break-all' }}>
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
                    <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight="600">LINKEDIN</Typography>
                      <Typography variant="body2" fontWeight="600" sx={{ wordBreak: 'break-all' }}>
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
                    <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight="600">GITHUB</Typography>
                      <Typography variant="body2" fontWeight="600" sx={{ wordBreak: 'break-all' }}>
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

      {/* 2. Targeted Section Edit Dialog */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSaveProfile}>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {getModalTitle()}
            <IconButton onClick={() => setEditModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3} sx={{ pt: 1 }}>
              {/* SECTION: Personal Information */}
              {(editSection === 'all' || editSection === 'personal') && (
                <>
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
                  {editSection === 'all' && <Divider />}
                </>
              )}

              {/* SECTION: Business & Payment Settings */}
              {(editSection === 'all' || editSection === 'business') && (
                <>
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
                        helperText="Generates scannable QR code on client invoices."
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
                  {editSection === 'all' && <Divider />}
                </>
              )}

              {/* SECTION: Professional Information */}
              {(editSection === 'all' || editSection === 'professional') && (
                <>
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
                  {editSection === 'all' && <Divider />}
                </>
              )}

              {/* SECTION: About Me */}
              {(editSection === 'all' || editSection === 'about') && (
                <>
                  <Typography variant="subtitle2" fontWeight="700" color="primary">
                    ABOUT ME / BIO
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="About Me / Bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell clients about your expertise, experience, and background..."
                      />
                    </Grid>
                  </Grid>
                  {editSection === 'all' && <Divider />}
                </>
              )}

              {/* SECTION: Online Presence */}
              {(editSection === 'all' || editSection === 'online') && (
                <>
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
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setEditModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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
          {profile?.paymentQrUrl ? (
            <Box
              component="img"
              src={profile.paymentQrUrl}
              alt="Enlarged Payment QR"
              sx={{ width: 250, height: 250, objectFit: 'contain' }}
            />
          ) : profile?.upiId ? (
            <QRCodeSVG value={upiUri} size={250} level="H" includeMargin={true} />
          ) : null}
        </Box>

        {profile?.upiId && (
          <Typography variant="subtitle1" fontWeight="700" color="primary.main" gutterBottom>
            {profile.upiId}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" display="block">
          Scan with any UPI App (GPay, PhonePe, Paytm) to make payment. Click anywhere to close.
        </Typography>
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
