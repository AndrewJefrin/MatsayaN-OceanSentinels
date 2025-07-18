const express = require('express');
const router = express.Router();
const alertService = require('../services/alertService');
const { authenticateToken, requireAdmin, requireBoatOwner } = require('../middleware/auth');

// Create a new alert (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await alertService.createAlert(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get alerts for a specific boat
router.get('/:boatNumber', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await alertService.getBoatAlerts(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Acknowledge an alert
router.post('/:boatNumber/:alertId/acknowledge', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber, alertId } = req.params;
    const result = await alertService.acknowledgeAlert(boatNumber, alertId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Mark alert as read
router.post('/:boatNumber/:alertId/read', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber, alertId } = req.params;
    const result = await alertService.markAlertAsRead(boatNumber, alertId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Create SOS alert
router.post('/sos', authenticateToken, async (req, res) => {
  try {
    const { location, message } = req.body;
    const result = await alertService.createSOSAlert(req.user.boatNumber, location, message);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Test voice alert
router.post('/test-voice/:boatNumber', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await alertService.testVoiceAlert(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all active alerts (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await alertService.getAllActiveAlerts();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Deactivate alert (admin only)
router.put('/:alertId/deactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { alertId } = req.params;
    const result = await alertService.deactivateAlert(alertId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get alert statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allAlerts = await alertService.getAllActiveAlerts();
    const totalAlerts = allAlerts.data.length;
    const criticalAlerts = allAlerts.data.filter(alert => alert.severity === 'critical').length;
    const acknowledgedAlerts = allAlerts.data.filter(alert => alert.acknowledgedBy.length > 0).length;

    res.status(200).json({
      success: true,
      data: {
        totalAlerts,
        criticalAlerts,
        acknowledgedAlerts,
        unacknowledgedAlerts: totalAlerts - acknowledgedAlerts,
        acknowledgmentRate: totalAlerts > 0 ? (acknowledgedAlerts / totalAlerts * 100).toFixed(2) : 0
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