const nodemailer = require('nodemailer');

/**
 * Creates Nodemailer transporter based on ENV vars (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD)
 * or fallback to SMTP_HOST / Ethereal test account for seamless local development.
 */
const getTransporter = async () => {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587');
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback Ethereal test account for out-of-the-box local testing
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

/**
 * Send 6-Digit Email Verification Code to newly registered user
 * Code expires in 10 minutes.
 */
const sendVerificationEmail = async (user, code) => {
  const userEmail = typeof user === 'string' ? user : user.email;
  const name = typeof user === 'object' ? (user.fullName || user.name) : 'there';

  console.log(`\n==================================================`);
  console.log(`🔑 6-DIGIT VERIFICATION CODE FOR ${userEmail}: [ ${code} ]`);
  console.log(`==================================================\n`);

  try {
    const transporter = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_FROM || '"ClientFlow Team" <no-reply@clientflow.com>',
      to: userEmail,
      subject: 'Verify your ClientFlow email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #2563eb; margin-bottom: 16px;">Welcome to ClientFlow! 🎉</h2>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">Thank you for creating your account. Please use the following 6-digit verification code to activate your account:</p>
          <div style="text-align: center; margin: 28px 0; background-color: #f1f5f9; padding: 16px; border-radius: 10px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e293b;">
            ${code}
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">This verification code will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">If you didn't create a ClientFlow account, you can safely ignore this email.</p>
          <br/>
          <p style="font-size: 14px; color: #334155; margin-top: 16px;">Thanks,<br/><strong>The ClientFlow Team</strong></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Test Email Sent. Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error('Error sending verification code email:', error);
    return null;
  }
};

/**
 * Send 6-Digit Password Reset Code to user
 * Code expires in 10 minutes.
 */
const sendPasswordResetEmail = async (user, code) => {
  const userEmail = typeof user === 'string' ? user : user.email;
  const name = typeof user === 'object' ? (user.fullName || user.name) : 'there';

  console.log(`\n==================================================`);
  console.log(`🔑 6-DIGIT PASSWORD RESET CODE FOR ${userEmail}: [ ${code} ]`);
  console.log(`==================================================\n`);

  try {
    const transporter = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_FROM || '"ClientFlow Team" <no-reply@clientflow.com>',
      to: userEmail,
      subject: 'Reset your ClientFlow password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #2563eb; margin-bottom: 16px;">Reset your ClientFlow password</h2>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">We received a request to reset the password for your ClientFlow account. Please use the following 6-digit verification code:</p>
          <div style="text-align: center; margin: 28px 0; background-color: #f1f5f9; padding: 16px; border-radius: 10px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb;">
            ${code}
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">This code will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          <br/>
          <p style="font-size: 14px; color: #334155; margin-top: 16px;">Thanks,<br/><strong>The ClientFlow Team</strong></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Test Email Sent. Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error('Error sending reset password code email:', error);
    return null;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
