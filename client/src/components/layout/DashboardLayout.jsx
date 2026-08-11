import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  InputBase,
  Badge,
  useTheme,
  useMediaQuery,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  NotificationsNone as NotificationsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  GridView as DashboardIcon,
  PeopleOutline as ClientsIcon,
  WorkOutline as ProjectsIcon,
  ReceiptOutlined as InvoicesIcon,
  AutoAwesomeOutlined as InsightsIcon,
  PersonOutline as ProfileIcon,
  SettingsOutlined as SettingsIcon,
  LogoutOutlined as LogoutIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useCustomTheme } from '../../context/ThemeContext';

const drawerWidth = 260;

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Clients', path: '/clients', icon: <ClientsIcon /> },
    { text: 'Projects', path: '/projects', icon: <ProjectsIcon /> },
    { text: 'Invoices & Payments', path: '/invoices', icon: <InvoicesIcon /> },
    { text: 'AI Insights', path: '/ai-insights', icon: <InsightsIcon /> },
    { text: 'Profile', path: '/profile', icon: <ProfileIcon /> },
    { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sidebar Header */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.2rem',
          }}
        >
          C
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
          ClientFlow
        </Typography>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flexGrow: 1, px: 2, py: 3 }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 0 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  onClick={() => isMobile && setMobileOpen(false)}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.2,
                    px: 2,
                    bgcolor: isActive 
                      ? (mode === 'dark' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.08)')
                      : 'transparent',
                    color: isActive ? 'primary.main' : 'text.secondary',
                    '&:hover': {
                      bgcolor: isActive 
                        ? (mode === 'dark' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.12)')
                        : (mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
                      color: isActive ? 'primary.main' : 'text.primary',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isActive ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.925rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Sidebar Footer (User details & Logout) */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 'auto',
          bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.3)' : 'rgba(248, 250, 252, 0.5)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar
            alt={user?.fullName || 'User'}
            src={""}
            sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 600 }}
          >
            {user?.fullName ? user.fullName[0].toUpperCase() : 'P'}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', noWrap: true }}>
              {user?.fullName || 'Pratik'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', noWrap: true }}>
              {user?.email || 'pratik@gmail.com'}
            </Typography>
          </Box>
        </Box>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            justifyContent: 'center',
            borderColor: 'divider',
            color: 'text.secondary',
            py: 1,
            borderRadius: 2,
            '&:hover': {
              borderColor: 'error.light',
              color: 'error.main',
              bgcolor: mode === 'dark' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.04)',
            }
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar Drawer Container */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Content wrapper */}
      <Box
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Header/Navbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
            {/* Left side navbar: Search and Toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1, display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>


            </Box>

            {/* Right side navbar: Theme, Notification, User Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Theme Toggle */}
              <IconButton onClick={toggleTheme} color="inherit" size="medium">
                {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>

              {/* Notification Placeholder */}
              <IconButton color="inherit" size="medium">
                <Badge variant="dot" color="primary" overlap="circular" anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>

              <Divider orientation="vertical" variant="middle" flexItem sx={{ height: 20, mx: 0.5 }} />

              {/* Profile Dropdown */}
              <Box
                onClick={handleProfileMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  p: 0.5,
                  pr: 1,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  },
                  transition: 'background-color 0.2s'
                }}
              >
                <Avatar
                  alt={user?.fullName || 'User'}
                  sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.85rem' }}
                >
                  {user?.fullName ? user.fullName[0].toUpperCase() : 'P'}
                </Avatar>
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600 }}>
                  {user?.fullName || 'Pratik'}
                </Typography>
                <ArrowDownIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
              </Box>

              <Menu
                anchorEl={profileAnchorEl}
                id="account-menu"
                open={Boolean(profileAnchorEl)}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 4,
                  sx: {
                    mt: 1,
                    minWidth: 160,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: mode === 'dark' ? '0 10px 20px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.05)',
                  },
                }}
              >
                <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }} sx={{ py: 1.2, px: 2 }}>
                  My Profile
                </MenuItem>
                <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }} sx={{ py: 1.2, px: 2 }}>
                  Settings
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleLogout} sx={{ py: 1.2, px: 2, color: 'error.main' }}>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content Pane */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: 'background.default',
            width: '100%',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
