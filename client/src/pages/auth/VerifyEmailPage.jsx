import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const VerifyEmailPage = () => {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // States
  const [verifying, setVerifying] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const executeVerification = async () => {
      if (!token) {
        setErrorMsg('Verification token is missing in URL.');
        setVerifying(false);
        return;
      }

      try {
        const response = await verifyEmail(token);
        setSuccessMsg(response.message || 'Your email address has been verified successfully!');
      } catch (err) {
        setErrorMsg(err.message || 'Failed to verify email. The link may have expired or is invalid.');
      } finally {
        setVerifying(false);
      }
    };

    executeVerification();
  }, [token]);

  return (
    <AuthLayout title="Account Verification" subtitle="Activating your ClientFlow profile.">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 2, gap: 3 }}>
        {verifying && (
          <>
            <CircularProgress size={48} thickness={4} color="primary" />
            <Typography variant="body1" color="text.secondary">
              Verifying your credentials with our database server. Please wait...
            </Typography>
          </>
        )}

        {!verifying && successMsg && (
          <>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: '#10B981' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Verification Successful!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {successMsg}
            </Typography>
            <Button 
              component={Link} 
              to="/login" 
              variant="contained" 
              fullWidth 
              size="large"
              sx={{ mt: 1, fontWeight: 700 }}
            >
              Proceed to Login
            </Button>
          </>
        )}

        {!verifying && errorMsg && (
          <>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: '#EF4444' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Verification Failed
            </Typography>
            <Alert severity="error" variant="outlined" sx={{ width: '100%', borderRadius: 2, textAlign: 'left' }}>
              {errorMsg}
            </Alert>
            <Button 
              component={Link} 
              to="/login" 
              variant="outlined" 
              fullWidth 
              size="large"
              sx={{ mt: 1, fontWeight: 700 }}
            >
              Back to Login
            </Button>
          </>
        )}
      </Box>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
