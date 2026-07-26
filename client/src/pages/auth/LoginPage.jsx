import React, { useState, useEffect } from 'react';
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
  FormControlLabel, 
  Checkbox, 
  Alert, 
  Snackbar, 
  CircularProgress 
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // States
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('clientflow-remember-email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Field check
    if (!email.trim() || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await login(email, password);
      
      // Save or clear email in local storage
      if (rememberMe) {
        localStorage.setItem('clientflow-remember-email', email);
      } else {
        localStorage.removeItem('clientflow-remember-email');
      }

      setSnackbar({ open: true, message: response.message || 'Login successful!', severity: 'success' });
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      setValidationError(err.message || 'Invalid email or password.');
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to manage your business operations.">
      <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {validationError && (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
            {validationError}
          </Alert>
        )}

        <TextField
          label="Enter your email"
          placeholder="Enter your email"
          type="email"
          variant="outlined"
          fullWidth
          required
          disabled={submitting}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          label="Enter your password"
          placeholder="Enter your password"
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: -0.5 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                color="primary" 
              />
            }
            label={<Typography variant="body2">Remember me</Typography>}
          />
          <Link 
            to="/forgot-password" 
            style={{ color: '#2563EB', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}
          >
            Forgot password?
          </Link>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={submitting}
          sx={{ height: 48, fontWeight: 700 }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
        </Button>

        <Typography variant="body2" color="text.secondary" align="center">
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
            Sign up
          </Link>
        </Typography>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
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

export default LoginPage;
