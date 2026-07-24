import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import { Box, Button, Typography, Container, Card, CircularProgress, IconButton } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useCustomTheme } from '../context/ThemeContext';

const FullScreenLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
    <CircularProgress size={48} thickness={4} />
  </Box>
);

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const DashboardPlaceholder = () => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useCustomTheme();

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ p: 4, textAlign: 'center', position: 'relative' }}>
        <IconButton 
          onClick={toggleTheme} 
          sx={{ position: 'absolute', top: 16, right: 16 }}
          color="inherit"
        >
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
        
        <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
          ClientFlow
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          AI-Powered Business Management Platform for Freelancers
        </Typography>
        
        <Box sx={{ my: 4, p: 2, bgcolor: mode === 'dark' ? 'slate.800' : 'grey.100', borderRadius: 2, textAlign: 'left', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Log In Session Details:</strong>
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Name: <strong>{user?.fullName}</strong>
          </Typography>
          <Typography variant="body1">
            Email: <strong>{user?.email}</strong>
          </Typography>
        </Box>
        
        <Button variant="contained" color="error" fullWidth size="large" onClick={logout}>
          Sign Out
        </Button>
      </Card>
    </Container>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <PublicRoute>
            <VerifyEmailPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPlaceholder />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
