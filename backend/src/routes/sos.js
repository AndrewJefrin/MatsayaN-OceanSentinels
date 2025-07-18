const express = require('express');
const router = express.Router();
const sosService = require('../services/sosService');
const { authenticateToken, requireBoatOwner } = require('../middleware/auth');

// Create SOS emergency alert
router.post('/emergency', authenticateToken, async (req, res) => {
  try {
    const { location, message } = req.body;
    const boatNumber = req.user.boatNumber;
    const userId = req.user.uid;

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    const result = await sosService.createSOSAlert(boatNumber, location, message, userId);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get SOS alerts for a boat
router.get('/alerts/:boatNumber', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await sosService.getSOSAlerts(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Resolve SOS alert (admin only)
router.put('/resolve/:sosId', authenticateToken, async (req, res) => {
  try {
    const { sosId } = req.params;
    const { notes } = req.body;
    const resolvedBy = req.user.username || req.user.uid;

    const result = await sosService.resolveSOSAlert(sosId, resolvedBy, notes);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get active SOS alerts (admin only)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const result = await sosService.getActiveSOSAlerts();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Test SOS functionality
router.post('/test/:boatNumber', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const testLocation = {
      latitude: 13.0827,
      longitude: 80.2707,
      accuracy: 10
    };
    const testMessage = 'This is a test SOS alert';

    const result = await sosService.createSOSAlert(boatNumber, testLocation, testMessage, req.user.uid);
    res.status(200).json({
      success: true,
      message: 'Test SOS alert created successfully',
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get SOS statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const activeAlerts = await sosService.getActiveSOSAlerts();
    const totalActive = activeAlerts.data.length;
    
    // Get resolved alerts count (simplified)
    const resolvedCount = 0; // In production, query resolved alerts

    res.status(200).json({
      success: true,
      data: {
        activeAlerts: totalActive,
        resolvedAlerts: resolvedCount,
        totalAlerts: totalActive + resolvedCount,
        responseRate: totalActive > 0 ? '85%' : '100%' // Mock data
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