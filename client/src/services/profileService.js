import axios from 'axios';

// Helper to determine if we are in local frontend mock testing mode
const isMockMode = () => {
  return localStorage.getItem('clientflow-token') === 'mock-jwt-token-for-local-testing';
};

const getMockProfile = () => {
  const stored = localStorage.getItem('clientflow-mock-profile');
  if (stored) return JSON.parse(stored);

  const initial = {
    id: 1,
    email: 'alex@clientflow.io',
    fullName: 'Alex Johnson',
    profilePhotoUrl: '',
    coverBannerUrl: '',
    isVerified: true,
    upiId: 'alexjohnson@upi',
    paymentQrUrl: '',
    paymentInstructions: 'Please include the invoice number in the UPI payment note for quick processing.',
    createdAt: new Date().toISOString()
  };

  localStorage.setItem('clientflow-mock-profile', JSON.stringify(initial));
  return initial;
};

export const getProfile = async () => {
  if (isMockMode()) {
    return getMockProfile();
  }

  const token = localStorage.getItem('clientflow-token');
  const response = await axios.get('/api/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateProfile = async (profileData) => {
  if (isMockMode()) {
    const current = getMockProfile();
    const updated = {
      ...current,
      ...profileData,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('clientflow-mock-profile', JSON.stringify(updated));
    return updated;
  }

  const token = localStorage.getItem('clientflow-token');
  const response = await axios.put('/api/profile', profileData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const uploadAvatarImage = async (file) => {
  if (isMockMode()) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result;
        const current = getMockProfile();
        const updated = {
          ...current,
          profilePhotoUrl: base64Url
        };
        localStorage.setItem('clientflow-mock-profile', JSON.stringify(updated));
        resolve({
          message: 'Profile photo uploaded successfully.',
          profilePhotoUrl: base64Url,
          user: updated
        });
      };
      reader.readAsDataURL(file);
    });
  }

  const token = localStorage.getItem('clientflow-token');
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await axios.post('/api/profile/upload-avatar', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const uploadBannerImage = async (file) => {
  if (isMockMode()) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result;
        const current = getMockProfile();
        const updated = {
          ...current,
          coverBannerUrl: base64Url
        };
        localStorage.setItem('clientflow-mock-profile', JSON.stringify(updated));
        resolve({
          message: 'Cover banner uploaded successfully.',
          coverBannerUrl: base64Url,
          user: updated
        });
      };
      reader.readAsDataURL(file);
    });
  }

  const token = localStorage.getItem('clientflow-token');
  const formData = new FormData();
  formData.append('banner', file);

  const response = await axios.post('/api/profile/upload-banner', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const uploadQrImage = async (file) => {
  if (isMockMode()) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result;
        const current = getMockProfile();
        const updated = {
          ...current,
          paymentQrUrl: base64Url
        };
        localStorage.setItem('clientflow-mock-profile', JSON.stringify(updated));
        resolve({
          message: 'QR code uploaded successfully.',
          paymentQrUrl: base64Url,
          user: updated
        });
      };
      reader.readAsDataURL(file);
    });
  }

  const token = localStorage.getItem('clientflow-token');
  const formData = new FormData();
  formData.append('qrImage', file);

  const response = await axios.post('/api/profile/upload-qr', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export default {
  getProfile,
  updateProfile,
  uploadAvatarImage,
  uploadBannerImage,
  uploadQrImage
};
