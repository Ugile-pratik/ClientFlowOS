import axios from 'axios';
import { getProfile, updateProfile } from './profileService';

const isMockMode = () => {
  return localStorage.getItem('clientflow-token') === 'mock-jwt-token-for-local-testing';
};

export const getSettings = async () => {
  return await getProfile();
};

export const updateSettings = async (settingsData) => {
  return await updateProfile(settingsData);
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  if (isMockMode()) {
    return { message: 'Password changed successfully (Mock Mode).' };
  }

  const token = localStorage.getItem('clientflow-token');
  const response = await axios.post(
    '/api/auth/change-password',
    { currentPassword, newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export default {
  getSettings,
  updateSettings,
  changePassword,
};
