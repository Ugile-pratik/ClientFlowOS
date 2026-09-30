const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadAvatarImage,
  uploadBannerImage,
  uploadQrImage,
  uploadAvatarMiddleware,
  uploadBannerMiddleware,
  uploadMiddleware,
} = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply JWT authentication middleware to all profile routes
router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/upload-avatar', uploadAvatarMiddleware, uploadAvatarImage);
router.post('/upload-banner', uploadBannerMiddleware, uploadBannerImage);
router.post('/upload-qr', uploadMiddleware, uploadQrImage);

module.exports = router;
