import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import { TextField, Button, Box, Typography, Alert, Snackbar, CircularProgress } from '@mui/material';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await forgotPassword(email);
      setSuccessMsg(response.message || 'Reset instructions sent to your email.');
      setSnackbarOpen(true);
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred. Please verify your email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to receive recovery instructions.">
      <Box component="form" onSubmit={handleForgotPassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {errorMsg && (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>
            {successMsg}
          </Alert>
        )}

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

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={submitting}
          sx={{ height: 48, fontWeight: 700 }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
        </Button>

        <Typography variant="body2" color="text.secondary" align="center">
          Remembered your password?{' '}
          <Link to="/login" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
            Back to login
          </Link>
        </Typography>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          {successMsg}
        </Alert>
      </Snackbar>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
