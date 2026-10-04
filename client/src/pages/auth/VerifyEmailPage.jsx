import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import { Box, Typography, Button, CircularProgress, Alert, TextField, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

const VerifyEmailPage = () => {
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Inputs
  const [code, setCode] = useState(token || '');
  const [verifying, setVerifying] = useState(Boolean(token));
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (token) {
      const executeVerification = async () => {
        try {
          const response = await verifyEmail(token);
          setSuccessMsg(response.message || 'Your email address has been verified successfully!');
        } catch (err) {
          setErrorMsg(err.message || 'Failed to verify 6-digit code. It may have expired or is invalid.');
        } finally {
          setVerifying(false);
        }
      };

      executeVerification();
    }
  }, [token]);

  const handleManualVerify = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit verification code.');
      return;
    }

    setVerifying(true);
    try {
      const response = await verifyEmail(cleanCode);
      setSuccessMsg(response.message || 'Email verified successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired 6-digit verification code.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AuthLayout title="Email Verification" subtitle="Activate your ClientFlow account using your 6-digit code.">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {verifying && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={48} thickness={4} color="primary" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Verifying 6-digit code with database server...
            </Typography>
          </Box>
        )}

        {!verifying && successMsg && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: '#10B981', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              Verification Successful!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {successMsg}
            </Typography>
            <Button 
              component={Link} 
              to="/login" 
              variant="contained" 
              fullWidth 
              size="large"
              sx={{ fontWeight: 700, height: 48 }}
            >
              Proceed to Login
            </Button>
          </Box>
        )}

        {!verifying && !successMsg && (
          <Box component="form" onSubmit={handleManualVerify} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {errorMsg && (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                {errorMsg}
              </Alert>
            )}

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: 'background.paper' }}>
              <MarkEmailReadIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Enter Verification Code
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Enter the 6-digit verification code sent to your email address.
              </Typography>
            </Paper>

            <TextField
              label="6-Digit Verification Code"
              placeholder="e.g. 584920"
              variant="outlined"
              fullWidth
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              inputProps={{
                maxLength: 6,
                style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4rem', fontWeight: 700 }
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={code.length !== 6}
              sx={{ height: 48, fontWeight: 700 }}
            >
              Verify & Activate Account
            </Button>

            <Typography variant="body2" color="text.secondary" align="center">
              Already activated?{' '}
              <Link to="/login" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
                Back to Login
              </Link>
            </Typography>
          </Box>
        )}
      </Box>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
