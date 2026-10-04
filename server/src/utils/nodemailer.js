const emailService = require('../services/email.service');

module.exports = {
  sendVerificationEmail: emailService.sendVerificationEmail,
  sendResetPasswordEmail: emailService.sendPasswordResetEmail,
};
