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
          // Token is invalid or expired
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
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user: loggedUser } = response.data;

      localStorage.setItem('clientflow-token', token);
      setUser(loggedUser);
      setLoading(false);
      return { success: true, message: response.data.message };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.error || 'An error occurred during login.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const register = async (fullName, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/register', { fullName, email, password });
      setLoading(false);
      return { success: true, message: response.data.message };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.error || 'An error occurred during registration.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const verifyEmail = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/verify-email', { token });
      setLoading(false);
      return { success: true, message: response.data.message };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.error || 'Failed to verify email.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      setLoading(false);
      return { success: true, message: response.data.message };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.error || 'Failed to send password reset request.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const resetPassword = async (token, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/reset-password', { token, password });
      setLoading(false);
      return { success: true, message: response.data.message };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.error || 'Failed to reset password.';
      setError(errMsg);
      throw new Error(errMsg);
    }
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
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
