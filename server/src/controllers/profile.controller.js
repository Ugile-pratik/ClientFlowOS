const path = require('path');
const fs = require('fs');
const multer = require('multer');
const profileService = require('../services/profile.service');

// Configure Multer storage
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `qr-${req.user.id}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = allowedTypes.test(file.mimetype);
  const extName = allowedTypes.test(ext);

  if (mimeType && extName) {
    return cb(null, true);
  }
  cb(new Error('Only image files (PNG, JPG/JPEG, WEBP) are allowed.'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

const getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const profile = await profileService.getProfile(userId);
    res.status(200).json(profile);
  } catch (error) {
    console.error('Get Profile Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const updateProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const { upiId, paymentInstructions } = req.body;

    // UPI ID format check if provided
    if (upiId && upiId.trim() !== '') {
      const upiRegex = /^[\w.-]+@[\w.-]+$/;
      if (!upiRegex.test(upiId.trim())) {
        return res.status(400).json({ error: 'Please enter a valid UPI ID such as name@upi.' });
      }
    }

    // Payment instructions length check
    if (paymentInstructions && paymentInstructions.length > 1000) {
      return res.status(400).json({ error: 'Payment instructions must be 1000 characters or less.' });
    }

    const updated = await profileService.updateProfile(userId, req.body);
    res.status(200).json(updated);
  } catch (error) {
    console.error('Update Profile Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const uploadQrImage = async (req, res) => {
  const userId = req.user.id;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select an image file to upload.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const updated = await profileService.updateProfile(userId, {
      paymentQrUrl: fileUrl,
    });

    res.status(200).json({
      message: 'QR code uploaded successfully.',
      paymentQrUrl: fileUrl,
      user: updated,
    });
  } catch (error) {
    console.error('Upload QR Image Error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload QR image.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadQrImage,
  uploadMiddleware: upload.single('qrImage'),
};
