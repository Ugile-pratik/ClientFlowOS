import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Setup global Axios defaults
  axios.defaults.baseURL = 'http://localhost:5000';

  // Request interceptor to attach JWT
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('clientflow-token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (err) => Promise.reject(err)
    );

    // Response interceptor to catch token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (err) => {
        if (err.response && err.response.status === 401) {
          logout();
        }
        return Promise.reject(err);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Validate token on reload to recover session
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('clientflow-token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Restore mock session immediately for testing
      if (token === 'mock-jwt-token-for-local-testing') {
        setUser({
          id: 999,
          fullName: 'Pratik',
          email: 'pratik@gmail.com',
          createdAt: new Date().toISOString()
        });
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/auth/me');
        setUser(response.data.user);
      } catch (err) {
        console.error('Session recovery failed:', err);
        localStorage.removeItem('clientflow-token');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    setError(null);

    // Mock Login Bypass for Local Frontend Testing
    if (email === 'pratik@gmail.com' && password === '1234') {
      const mockUser = {
        id: 999,
        fullName: 'Pratik',
        email: 'pratik@gmail.com',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('clientflow-token', 'mock-jwt-token-for-local-testing');
      setUser(mockUser);
      return { success: true, message: 'Login successful (Mock Mode)!' };
    }

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user: loggedUser } = response.data;

      localStorage.setItem('clientflow-token', token);
      setUser(loggedUser);
      return { success: true, message: response.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.error || 'An error occurred during login.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const register = async (fullName, email, password) => {
    setError(null);
    try {
      const response = await axios.post('/api/auth/register', { fullName, email, password });
      return { success: true, message: response.data.message, email: response.data.email || email };
    } catch (err) {
      const errMsg = err.response?.data?.error || 'An error occurred during registration.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const resendCode = async (email) => {
    setError(null);
    try {
      const response = await axios.post('/api/auth/resend-code', { email });
      return { success: true, message: response.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to resend verification code.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const verifyEmail = async (code, email = null) => {
    setError(null);
    try {
      const response = await axios.post('/api/auth/verify-email', { code, token: code, email });
      return { success: true, message: response.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to verify 6-digit code.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      return { success: true, message: response.data.message, email: response.data.email || email };
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to send password reset code.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const resetPassword = async (code, password, email = null) => {
    setError(null);
    try {
      const response = await axios.post('/api/auth/reset-password', { code, token: code, password, email });
      return { success: true, message: response.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to reset password.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const updateUser = (updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : updatedData));
  };

  const logout = () => {
    localStorage.removeItem('clientflow-token');
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        resendCode,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
