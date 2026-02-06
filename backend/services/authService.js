const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Entrepreneur = require('../models/Entrepreneur');
const Investor = require('../models/Investor');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "512mughees@gmail.com",
    pass: "olvu mghm kmbu furw"
  }
});

const register = async (userData) => {
  const { email, password, role, ...otherData } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  let user;
  if (role === 'entrepreneur') {
    user = new Entrepreneur({ email, password: hashedPassword, ...otherData });
  } else if (role === 'investor') {
    user = new Investor({ email, password: hashedPassword, ...otherData });
  } else {
    throw new Error('Invalid role');
  }
  await user.save();
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token };
};

const login = async (email, password, role) => {
  let user;
  if (role === 'entrepreneur') {
    user = await Entrepreneur.findOne({ email });
  } else if (role === 'investor') {
    user = await Investor.findOne({ email });
  } else {
    throw new Error('Invalid role');
  }
  if (!user) {
    throw new Error('User not found');
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token };
};

const forgotPassword = async (email) => {
  let user = await Entrepreneur.findOne({ email });
  if (!user) {
    user = await Investor.findOne({ email });
  }
  if (!user) {
    throw new Error('User not found');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = Date.now() + 3600000; // 1 hour

  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: "512mughees@gmail.com",
    to: email,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`
  };

  await transporter.sendMail(mailOptions);
};

const resetPassword = async (token, newPassword) => {
  let user = await Entrepreneur.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
  if (!user) {
    user = await Investor.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
  }
  if (!user) {
    throw new Error('Invalid or expired token');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();
};

const changePassword = async (userId, currentPassword, newPassword) => {
  let user = await Entrepreneur.findById(userId);
  if (!user) {
    user = await Investor.findById(userId);
  }
  if (!user) {
    throw new Error('User not found');
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
};

module.exports = { register, login, forgotPassword, resetPassword, changePassword }
