const nodemailer = require('nodemailer');

const getTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Ethereal test account so it works out of the box locally
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

const sendVerificationEmail = async (email, fullName, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

  console.log(`\n==================================================`);
  console.log(`📧 EMAIL VERIFICATION LINK FOR ${email}:`);
  console.log(verificationLink);
  console.log(`==================================================\n`);

  try {
    const transporter = await getTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM || '"ClientFlow Admin" <no-reply@clientflow.com>',
      to: email,
      subject: 'Verify your ClientFlow Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb; font-weight: bold; margin-bottom: 24px;">Welcome to ClientFlow, ${fullName}!</h2>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">Thank you for registering. Please click the button below to verify your email address and activate your account. This link is valid for 24 hours.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">Verify Email Address</a>
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">If the button above does not work, copy and paste this link into your browser:</p>
          <p style="font-size: 14px; color: #2563eb; word-break: break-all;"><a href="${verificationLink}">${verificationLink}</a></p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you did not request this registration, please ignore this email.</p>
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
    console.error('Error sending verification email:', error);
    return null;
  }
};

const sendResetPasswordEmail = async (email, fullName, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  console.log(`\n==================================================`);
  console.log(`🔑 PASSWORD RESET LINK FOR ${email}:`);
  console.log(resetLink);
  console.log(`==================================================\n`);

  try {
    const transporter = await getTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM || '"ClientFlow Admin" <no-reply@clientflow.com>',
      to: email,
      subject: 'Reset your ClientFlow Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb; font-weight: bold; margin-bottom: 24px;">Reset Password Request</h2>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">Hello ${fullName}, we received a request to reset your ClientFlow password. Please click the button below to set a new password. This link is valid for 1 hour.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">If the button above does not work, copy and paste this link into your browser:</p>
          <p style="font-size: 14px; color: #2563eb; word-break: break-all;"><a href="${resetLink}">${resetLink}</a></p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you did not request a password reset, you can safely ignore this email.</p>
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
    console.error('Error sending reset password email:', error);
    return null;
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};
