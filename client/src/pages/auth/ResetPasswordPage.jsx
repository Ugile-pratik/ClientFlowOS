import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import { TextField, Button, Box, Typography, Alert, Snackbar, CircularProgress, InputAdornment, IconButton, Paper } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/Key';

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Inputs
  const [code, setCode] = useState(token || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMsg('Please enter a 6-digit reset code.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await resetPassword(cleanCode, password);
      setSuccessMsg(response.message || 'Password updated successfully!');
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password. The 6-digit code may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your 6-digit reset code and new password below.">
      <Box component="form" onSubmit={handleResetPassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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

        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: 'background.paper' }}>
          <KeyIcon sx={{ fontSize: 36, color: 'primary.main', mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            Enter the 6-digit code sent to your email and your new password.
          </Typography>
        </Paper>

        <TextField
          label="6-Digit Reset Code"
          placeholder="e.g. 395812"
          variant="outlined"
          fullWidth
          required
          disabled={submitting}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          inputProps={{
            maxLength: 6,
            style: { textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.4rem', fontWeight: 700 }
          }}
        />

        <TextField
          label="New Password"
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

        <TextField
          label="Confirm New Password"
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
          disabled={submitting || code.length !== 6}
          sx={{ height: 48, fontWeight: 700 }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
        </Button>

        <Typography variant="body2" color="text.secondary" align="center">
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

export default ResetPasswordPage;
