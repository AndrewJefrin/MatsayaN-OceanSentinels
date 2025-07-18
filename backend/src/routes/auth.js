const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticateToken } = require('../middleware/auth');

// User registration
router.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await authService.getUserProfile(req.user.uid);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Update boat profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await authService.updateBoatProfile(req.user.uid, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const result = await authService.logout(req.user.uid);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Check boat number availability
router.get('/check-boat/:boatNumber', async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const exists = await authService.checkBoatNumberExists(boatNumber);
    res.status(200).json({
      success: true,
      data: {
        boatNumber,
        available: !exists
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Check email availability
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const exists = await authService.checkEmailExists(email);
    res.status(200).json({
      success: true,
      data: {
        email,
        available: !exists
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 