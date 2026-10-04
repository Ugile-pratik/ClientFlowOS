const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const emailService = require('../services/email.service');

// Helper to generate a secure 6-digit numeric OTP code
const generate6DigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res) => {
  const { fullName, email, password } = req.body;
  const cleanEmail = String(email || '').toLowerCase().trim();
  const cleanName = String(fullName || '').trim();

  if (!cleanName || !cleanEmail || !password) {
    return res.status(400).json({ error: 'Full name, email address, and password are required.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    const code = generate6DigitCode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ error: 'An account with this email address already exists and is verified. Please log in.' });
      }

      // If user exists but is unverified, update details and generate a fresh 6-digit code
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          fullName: cleanName,
          password: hashedPassword,
          verificationToken: code,
          verificationTokenExpiry: codeExpiry,
        },
      });

      try {
        await emailService.sendVerificationEmail(updatedUser, code);
      } catch (mailErr) {
        console.error('Failed to dispatch verification email:', mailErr);
      }

      return res.status(200).json({
        message: `A 6-digit verification code has been dispatched to ${cleanEmail}.`,
        email: cleanEmail,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        fullName: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        isVerified: false,
        verificationToken: code,
        verificationTokenExpiry: codeExpiry,
      },
    });

    try {
      await emailService.sendVerificationEmail(newUser, code);
    } catch (mailErr) {
      console.error('Failed to dispatch verification email:', mailErr);
    }

    res.status(201).json({
      message: `Registration successful! A 6-digit verification code has been dispatched to ${cleanEmail}.`,
      email: cleanEmail,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

const resendVerificationCode = async (req, res) => {
  const { email } = req.body;
  const cleanEmail = String(email || '').toLowerCase().trim();

  if (!cleanEmail) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'This email address is already verified. You can log in.' });
    }

    const code = generate6DigitCode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: code,
        verificationTokenExpiry: codeExpiry,
      },
    });

    try {
      await emailService.sendVerificationEmail(user, code);
    } catch (mailErr) {
      console.error('Failed to dispatch verification email:', mailErr);
    }

    res.status(200).json({ message: `A new 6-digit verification code has been dispatched to ${cleanEmail}.` });
  } catch (error) {
    console.error('Resend verification code error:', error);
    res.status(500).json({ error: 'Failed to resend verification code.' });
  }
};

const verifyEmail = async (req, res) => {
  const { email, code, token } = req.body;
  const cleanEmail = String(email || '').toLowerCase().trim();
  const inputCode = String(code || token || '').trim();

  if (!inputCode) {
    return res.status(400).json({ error: '6-digit verification code is required.' });
  }

  try {
    let user = null;

    if (cleanEmail) {
      user = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          verificationToken: inputCode,
          verificationTokenExpiry: {
            gt: new Date(Date.now() - 30000), // 30s clock skew buffer
          },
        },
      });
    }

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          verificationToken: inputCode,
          verificationTokenExpiry: {
            gt: new Date(Date.now() - 30000),
          },
        },
      });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit verification code. Please request a new code.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    res.status(200).json({ message: 'Email address verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error during email verification.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = String(email || '').toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Your email address is not verified. Please verify your email using the 6-digit code.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_me_in_production',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        profilePhotoUrl: user.profilePhotoUrl,
        coverBannerUrl: user.coverBannerUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const cleanEmail = String(email || '').toLowerCase().trim();

  if (!cleanEmail) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return res.status(404).json({ error: 'No account associated with this email address was found.' });
    }

    const code = generate6DigitCode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: code,
        resetPasswordTokenExpiry: codeExpiry,
      },
    });

    try {
      await emailService.sendPasswordResetEmail(user, code);
    } catch (mailErr) {
      console.error('Failed to dispatch password reset email:', mailErr);
    }

    res.status(200).json({
      message: `A 6-digit password reset code has been sent to ${cleanEmail}.`,
      email: cleanEmail,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error during forgot password processing.' });
  }
};

const resetPassword = async (req, res) => {
  const { email, code, token, password } = req.body;
  const cleanEmail = String(email || '').toLowerCase().trim();
  const inputCode = String(code || token || '').trim();

  if (!inputCode || !password) {
    return res.status(400).json({ error: '6-digit reset code and new password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    let user = null;

    if (cleanEmail) {
      user = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          resetPasswordToken: inputCode,
          resetPasswordTokenExpiry: {
            gt: new Date(Date.now() - 30000),
          },
        },
      });
    }

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: inputCode,
          resetPasswordTokenExpiry: {
            gt: new Date(Date.now() - 30000),
          },
        },
      });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit password reset code.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    res.status(200).json({ message: 'Password has been reset successfully! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error during password reset.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePhotoUrl: true,
        coverBannerUrl: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error during profile retrieval.' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
};

module.exports = {
  register,
  resendVerificationCode,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
};
