import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext();

export const useCustomTheme = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // 1. Check local storage
    const savedMode = localStorage.getItem('clientflow-theme');
    if (savedMode) return savedMode;

    // 2. Check browser preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setMode((prevMode) => {
      const nextMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('clientflow-theme', nextMode);
      return nextMode;
    });
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#2563EB', // Blue accent color
        light: '#60a5fa',
        dark: '#1d4ed8',
      },
      background: {
        default: mode === 'dark' ? '#0F172A' : '#F8FAFC', // Slate background colors
        paper: mode === 'dark' ? '#1E293B' : '#FFFFFF',
      },
      text: {
        primary: mode === 'dark' ? '#F1F5F9' : '#0F172A',
        secondary: mode === 'dark' ? '#94A3B8' : '#475569',
      },
      divider: mode === 'dark' ? '#334155' : '#E2E8F0',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
      h1: { fontWeight: 800 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      body1: { fontSize: '0.975rem' },
    },
    shape: {
      borderRadius: 12, // Modern rounded elements (12px)
    },
    shadows: [
      'none',
      mode === 'dark' ? '0 1px 2px 0 rgba(0,0,0,0.5)' : '0 1px 2px 0 rgba(0,0,0,0.05)',
      mode === 'dark' ? '0 2px 4px 0 rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
      // Rest can be standard defaults, but custom override shapes
      ...Array(22).fill(mode === 'dark' 
        ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)' 
        : '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03)')
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 16px',
            transition: 'all 200ms ease-in-out',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16, // Soft rounded borders
            border: `1px solid ${mode === 'dark' ? '#334155' : '#E2E8F0'}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: 'border-color 200ms ease-in-out',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
