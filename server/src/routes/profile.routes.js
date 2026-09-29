const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadQrImage,
  uploadMiddleware,
} = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply JWT authentication middleware to all profile routes
router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/upload-qr', uploadMiddleware, uploadQrImage);

module.exports = router;
