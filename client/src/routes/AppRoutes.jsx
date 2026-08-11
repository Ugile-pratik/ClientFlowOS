import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import DashboardLayout from '../components/layout/DashboardLayout';
import ClientListPage from '../pages/clients/ClientListPage';
import ClientFormPage from '../pages/clients/ClientFormPage';
import ClientProfilePage from '../pages/clients/ClientProfilePage';
import { Box, Typography, Card, CircularProgress, Button } from '@mui/material';

const FullScreenLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
    <CircularProgress size={48} thickness={4} />
  </Box>
);

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return isAuthenticated ? (
    <DashboardLayout>{children}</DashboardLayout>
  ) : (
    <Navigate to="/login" replace />
  );
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const PlaceholderPage = ({ title }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <Card sx={{ p: 5, maxWidth: 500, width: '100%', textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
      <Typography variant="h5" color="primary" gutterBottom sx={{ fontWeight: 800 }}>
        {title} Module
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        The {title.toLowerCase()} system is currently under development. Stay tuned for updates!
      </Typography>
      <Button variant="contained" component={Link} to="/" size="medium">
        Back to Dashboard
      </Button>
    </Card>
  </Box>
);

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
      
      {/* Protected Routes inside DashboardLayout */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <PrivateRoute>
            <ClientListPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/clients/new"
        element={
          <PrivateRoute>
            <ClientFormPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/clients/:id"
        element={
          <PrivateRoute>
            <ClientProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/clients/:id/edit"
        element={
          <PrivateRoute>
            <ClientFormPage isEdit={true} />
          </PrivateRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <PlaceholderPage title="Projects" />
          </PrivateRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <PrivateRoute>
            <PlaceholderPage title="Invoices & Payments" />
          </PrivateRoute>
        }
      />
      <Route
        path="/ai-insights"
        element={
          <PrivateRoute>
            <PlaceholderPage title="AI Insights" />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <PlaceholderPage title="Profile" />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <PlaceholderPage title="Settings" />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
