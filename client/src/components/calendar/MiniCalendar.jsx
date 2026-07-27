import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Grid,
  Card,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme
} from '@mui/material';
import {
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon,
  FiberManualRecord as DotIcon
} from '@mui/icons-material';

const MiniCalendar = ({ events = [] }) => {
  const theme = useTheme();
  const today = new Date();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Starting day of the week (0 = Sunday, 6 = Saturday)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Pad with previous month's final days
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthDays - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true
    });
  }

  // Pad with next month's starting days to fill the grid (usually 42 cells total for 6 weeks)
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false
    });
  }

  // Helper to format date key YYYY-MM-DD
  const formatDateKey = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Get events on a specific day
  const getDayEvents = (y, m, d) => {
    const key = formatDateKey(y, m, d);
    return events.filter(e => e.date === key);
  };

  const selectedKey = formatDateKey(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const selectedDateEvents = events.filter(e => e.date === selectedKey);

  return (
    <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Calendar Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {monthNames[month]} {year}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={handlePrevMonth} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <LeftIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleNextMonth} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <RightIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Week Day Labels */}
      <Grid container columns={7} sx={{ textAlign: 'center', mb: 1 }}>
        {daysOfWeek.map((day, idx) => (
          <Grid item xs={1} key={idx}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar Grid */}
      <Grid container columns={7} spacing={0.5} sx={{ textAlign: 'center', mb: 3 }}>
        {calendarDays.map((cell, idx) => {
          const dayEvents = getDayEvents(cell.year, cell.month, cell.day);
          const isToday = cell.day === today.getDate() && cell.month === today.getMonth() && cell.year === today.getFullYear();
          const isSelected = cell.day === selectedDate.getDate() && cell.month === selectedDate.getMonth() && cell.year === selectedDate.getFullYear();

          return (
            <Grid item xs={1} key={idx}>
              <Box
                onClick={() => setSelectedDate(new Date(cell.year, cell.month, cell.day))}
                sx={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: 2.5,
                  position: 'relative',
                  bgcolor: isSelected
                    ? 'primary.main'
                    : isToday
                      ? (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)')
                      : 'transparent',
                  color: isSelected
                    ? 'primary.contrastText'
                    : cell.isCurrentMonth
                      ? 'text.primary'
                      : 'text.secondary',
                  opacity: cell.isCurrentMonth ? 1 : 0.4,
                  border: isToday && !isSelected ? `1px solid ${theme.palette.primary.main}` : 'none',
                  '&:hover': {
                    bgcolor: isSelected
                      ? 'primary.main'
                      : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'),
                  },
                  transition: 'all 0.15s ease',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isToday || isSelected ? 700 : 500,
                    fontSize: '0.875rem',
                  }}
                >
                  {cell.day}
                </Typography>

                {/* Event Dots */}
                {dayEvents.length > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      display: 'flex',
                      gap: 0.3,
                      justifyContent: 'center',
                    }}
                  >
                    {dayEvents.slice(0, 3).map((ev, eIdx) => (
                      <Box
                        key={eIdx}
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          bgcolor: isSelected ? 'white' : ev.color,
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Selected Date Events List */}
      <Box sx={{ mt: 'auto', borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', uppercase: true, display: 'block', mb: 1 }}>
          Events on {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Typography>

        {selectedDateEvents.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1, fontStyle: 'italic', fontSize: '0.85rem' }}>
            No deadlines or payments scheduled.
          </Typography>
        ) : (
          <List dense disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {selectedDateEvents.map((ev, idx) => (
              <ListItem
                key={idx}
                disableGutters
                sx={{
                  p: 1.2,
                  px: 1.5,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.01)',
                  borderLeft: `3px solid ${ev.color}`
                }}
              >
                <ListItemText
                  primary={ev.title}
                  secondary={ev.type.charAt(0).toUpperCase() + ev.type.slice(1)}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Card>
  );
};

export default MiniCalendar;
