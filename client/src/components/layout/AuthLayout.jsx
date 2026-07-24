import React from 'react';
import { Box, Card, Typography, IconButton, useTheme } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useCustomTheme } from '../../context/ThemeContext';

const AuthLayout = ({ children, title, subtitle }) => {
  const { mode, toggleTheme } = useCustomTheme();
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Visual illustration side (Hidden on mobile) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          background: mode === 'dark' 
            ? 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' 
            : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Modern aesthetic background grids */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: mode === 'dark' ? 0.05 : 0.4,
            backgroundImage: `radial-gradient(${theme.palette.primary.main} 1.5px, transparent 1.5px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            ClientFlow
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1, my: 'auto', maxWidth: 460 }}>
          <Typography variant="h3" color="text.primary" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
            Empower your freelancing career.
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            Manage clients, track project budgets, issue professional invoices, and receive rule-based recommendation alerts.
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} ClientFlow. All rights reserved.
          </Typography>
        </Box>
      </Box>

      {/* Form pane */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 2, sm: 4, md: 6 },
          position: 'relative',
        }}
      >
        {/* Floating Theme Toggle */}
        <IconButton
          onClick={toggleTheme}
          sx={{ position: 'absolute', top: 24, right: 24 }}
          color="inherit"
        >
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        <Box sx={{ width: '100%', maxWidth: 440 }}>
          <Card
            sx={{
              p: { xs: 3, sm: 5 },
              boxShadow: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Box>
              <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800, letterSpacing: '-0.5px', mb: 0.5 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>

            {children}
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;
