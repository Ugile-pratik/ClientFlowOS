import React, { useState, useEffect } from 'react';
import {
  Popover,
  Box,
  Typography,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Tooltip
} from '@mui/material';
import {
  NotificationsNone as BellIcon,
  Warning as OverdueIcon,
  Schedule as ClockIcon,
  CheckCircle as PaymentIcon,
  InfoOutlined as InfoIcon,
  DoneAll as MarkReadIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const NotificationPopover = ({ onOpenPaymentModal }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds to keep live notifications updated
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <OverdueIcon fontSize="small" color="error" />;
      case 'warning':
        return <ClockIcon fontSize="small" color="warning" />;
      case 'success':
        return <PaymentIcon fontSize="small" color="success" />;
      default:
        return <InfoIcon fontSize="small" color="info" />;
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ALERTS') return item.category === 'Alerts';
    return true;
  });

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton onClick={handleClick} color="inherit" size="medium">
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <BellIcon fontSize="small" />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 6,
          sx: {
            mt: 1.5,
            width: { xs: 340, sm: 400 },
            maxHeight: 520,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} new`} size="small" color="error" sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }} />
            )}
          </Box>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllRead}
              startIcon={<MarkReadIcon fontSize="small" />}
              sx={{ textTransform: 'none', fontSize: '0.8rem', color: 'text.secondary' }}
            >
              Mark read
            </Button>
          )}
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,41,59,0.3)' : 'rgba(248,250,252,0.6)' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ minHeight: 38 }}
          >
            <Tab label="All" value="ALL" sx={{ minHeight: 38, fontSize: '0.8rem', fontWeight: 600 }} />
            <Tab label="Alerts" value="ALERTS" sx={{ minHeight: 38, fontSize: '0.8rem', fontWeight: 600 }} />
          </Tabs>
        </Box>

        {/* List Body */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <BellIcon sx={{ fontSize: 36, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No recent notifications
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredNotifications.map((notif) => (
                <React.Fragment key={notif.id}>
                  <ListItem
                    sx={{
                      py: 1.5,
                      px: 2,
                      alignItems: 'flex-start',
                      bgcolor: !notif.read
                        ? (theme) => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.04)'
                        : 'transparent',
                      '&:hover': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                      },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                      {getSeverityIcon(notif.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: !notif.read ? 700 : 600, fontSize: '0.875rem' }}>
                            {notif.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontSize: '0.725rem' }}>
                            {formatRelativeTime(notif.timestamp)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                            {notif.message}
                          </Typography>
                          {notif.action && (
                            <Button
                              size="small"
                              variant="text"
                              color="primary"
                              onClick={() => {
                                handleClose();
                                if (notif.action?.route) {
                                  navigate(notif.action.route);
                                }
                              }}
                              endIcon={<ArrowIcon fontSize="small" />}
                              sx={{ p: 0, mt: 0.5, fontSize: '0.75rem', textTransform: 'none', fontWeight: 600 }}
                            >
                              {notif.action.label}
                            </Button>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer info banner */}
        <Box sx={{ p: 1.2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.5)' : 'rgba(241,245,249,0.5)' }}>
          <Typography variant="caption" color="text.secondary">
            ⚡ Retains activity from last 14 days • Memory optimized
          </Typography>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationPopover;
