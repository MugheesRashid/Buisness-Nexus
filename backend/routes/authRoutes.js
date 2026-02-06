const express = require('express');
const { register, login, forgotPassword, resetPassword, changePassword } = require('../services/authService');
const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    const user = await register(req.body);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const { user, token } = await login(email, password, role);
    res.json({ message: 'Login successful', user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    await forgotPassword(email);
    res.json({ message: 'Password reset instructions sent to your email' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Reset password route
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    await resetPassword(token, password);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Change password route
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    await changePassword(userId, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
