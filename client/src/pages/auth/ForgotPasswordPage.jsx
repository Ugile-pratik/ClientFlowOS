import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/Key';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ForgotPasswordPage = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Step 1 = Request Code, Step 2 = Enter 6-Digit Code & Set New Password
  const [step, setStep] = useState(1);

  // Inputs
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Step 1: Request 6-digit reset code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await forgotPassword(email);
      setSnackbar({ open: true, message: response.message || '6-digit reset code sent!', severity: 'success' });
      setStep(2); // Move to 6-digit code verification step
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send password reset code.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify 6-digit code & reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit reset code.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await resetPassword(cleanCode, newPassword, email);
      setSnackbar({ open: true, message: response.message || 'Password reset successfully!', severity: 'success' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired 6-digit code.');
    } finally {
      setSubmitting(false);
    }
  };

  // Resend 6-Digit Code
  const handleResendCode = async () => {
    setResending(true);
    setErrorMsg('');
    try {
      const response = await forgotPassword(email);
      setSnackbar({ open: true, message: response.message || 'New 6-digit code dispatched to your email.', severity: 'info' });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title={step === 1 ? 'Forgot Password' : 'Reset Your Password'}
      subtitle={step === 1 ? 'Enter your email address to receive a 6-digit recovery code.' : `Enter the 6-digit code sent to ${email}`}
    >
      {step === 1 ? (
        /* STEP 1: REQUEST 6-DIGIT RESET CODE */
        <Box component="form" onSubmit={handleRequestCode} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {errorMsg && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <TextField
            label="Email Address"
            type="email"
            variant="outlined"
            fullWidth
            required
            autoFocus
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
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Send 6-Digit Code'}
          </Button>

          <Typography variant="body2" color="text.secondary" align="center">
            Remembered your password?{' '}
            <Link to="/login" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
              Back to login
            </Link>
          </Typography>
        </Box>
      ) : (
        /* STEP 2: ENTER 6-DIGIT CODE & NEW PASSWORD */
        <Box component="form" onSubmit={handleResetPassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {errorMsg && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: 'background.paper' }}>
            <KeyIcon sx={{ fontSize: 40, color: 'primary.main', mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              A 6-digit reset code was dispatched to <strong>{email}</strong> (valid for 10 minutes).
            </Typography>
          </Paper>

          <TextField
            label="6-Digit Reset Code"
            placeholder="e.g. 395812"
            variant="outlined"
            fullWidth
            required
            autoFocus
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
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1 }}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => setStep(1)}
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              Change Email
            </Button>
            <Button
              size="small"
              onClick={handleResendCode}
              disabled={resending}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {resending ? 'Resending...' : 'Resend Code'}
            </Button>
          </Box>
        </Box>
      )}

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

export default ForgotPasswordPage;
