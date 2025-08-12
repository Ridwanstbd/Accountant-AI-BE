const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendWelcomeEmail(email, username) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Welcome to Our Platform",
      html: `
        <h1>Welcome, ${username}!</h1>
        <p>Your account has been created successfully.</p>
        <p>You can now login and start using our platform.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <h1>Password Reset</h1>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendBusinessInvitation(email, businessName, inviteCode) {
    const inviteUrl = `${process.env.FRONTEND_URL}/join-business?code=${inviteCode}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Invitation to join ${businessName}`,
      html: `
        <h1>Business Invitation</h1>
        <p>You have been invited to join ${businessName}.</p>
        <p>Click the link below to accept the invitation:</p>
        <a href="${inviteUrl}">Join Business</a>
        <p>If you don't have an account, you'll need to register first.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
