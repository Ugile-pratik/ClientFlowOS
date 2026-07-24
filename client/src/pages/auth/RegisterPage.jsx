import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  InputAdornment, 
  IconButton, 
  LinearProgress, 
  Alert, 
  Snackbar, 
  CircularProgress 
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Validation / Message alerts
  const [validationError, setValidationError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Calculate password strength
  const checkPasswordStrength = (pwd) => {
    if (!pwd) return { value: 0, label: '', color: 'grey.300' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 1:
        return { value: 25, label: 'Weak', color: '#EF4444' }; // Red
      case 2:
        return { value: 50, label: 'Fair', color: '#F59E0B' }; // Orange
      case 3:
        return { value: 75, label: 'Good', color: '#3B82F6' }; // Blue
      case 4:
        return { value: 100, label: 'Strong', color: '#10B981' }; // Green
      default:
        return { value: 0, label: '', color: 'grey.300' };
    }
  };

  const strength = checkPasswordStrength(password);

  const handleRegister = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Pre-flight check
    if (!fullName.trim()) {
      setValidationError('Full Name is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await register(fullName, email, password);
      setSnackbar({ open: true, message: response.message, severity: 'success' });
      // Redirect to login after a brief delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setValidationError(err.message || 'An error occurred during registration.');
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create an account" subtitle="Get started with ClientFlow today.">
      <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {validationError && (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
            {validationError}
          </Alert>
        )}

        <TextField
          label="Full Name"
          variant="outlined"
          fullWidth
          required
          disabled={submitting}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <TextField
          label="Email Address"
          type="email"
          variant="outlined"
          fullWidth
          required
          disabled={submitting}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          fullWidth
          required
          disabled={submitting}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {password && (
          <Box sx={{ mt: -0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Password Strength:</Typography>
              <Typography variant="caption" sx={{ color: strength.color, fontWeight: 700 }}>
                {strength.label}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={strength.value} 
              sx={{ 
                height: 6, 
                borderRadius: 3, 
                bgcolor: 'divider',
                '& .MuiLinearProgress-bar': {
                  bgcolor: strength.color,
                }
              }} 
            />
          </Box>
        )}

        <TextField
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          variant="outlined"
          fullWidth
          required
          disabled={submitting}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={submitting}
          sx={{ height: 48, fontWeight: 700 }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
        </Button>

        <Typography variant="body2" color="text.secondary" align="center">
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
            Log in
          </Link>
        </Typography>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AuthLayout>
  );
};

export default RegisterPage;
