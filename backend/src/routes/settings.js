const express = require('express');
const router = express.Router();
const settingsService = require('../services/settingsService');
const { authenticateToken, requireBoatOwner, requireAdmin } = require('../middleware/auth');

// Get user settings
router.get('/:boatNumber', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await settingsService.getUserSettings(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user settings
router.put('/:boatNumber', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await settingsService.updateUserSettings(boatNumber, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Reset user settings to default
router.post('/:boatNumber/reset', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await settingsService.resetUserSettings(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get emergency contacts
router.get('/:boatNumber/emergency-contacts', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await settingsService.getEmergencyContacts(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add emergency contact
router.post('/:boatNumber/emergency-contacts', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await settingsService.addEmergencyContact(boatNumber, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update emergency contact
router.put('/:boatNumber/emergency-contacts/:contactId', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber, contactId } = req.params;
    const result = await settingsService.updateEmergencyContact(boatNumber, contactId, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete emergency contact
router.delete('/:boatNumber/emergency-contacts/:contactId', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber, contactId } = req.params;
    const result = await settingsService.deleteEmergencyContact(boatNumber, contactId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get app configuration
router.get('/app/configuration', async (req, res) => {
  try {
    const result = await settingsService.getAppConfiguration();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update app configuration (admin only)
router.put('/app/configuration', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await settingsService.updateAppConfiguration(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get user preferences summary
router.get('/:boatNumber/preferences', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await settingsService.getUserPreferencesSummary(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Export user data
router.get('/:boatNumber/export', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await settingsService.exportUserData(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get system statistics (admin only)
router.get('/system/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await settingsService.getSystemStatistics();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get language preferences
router.get('/:boatNumber/language', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const settings = await settingsService.getUserSettings(boatNumber);
    
    res.status(200).json({
      success: true,
      data: {
        language: settings.data.language,
        availableLanguages: ['tamil', 'english']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update language preference
router.put('/:boatNumber/language', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const { language } = req.body;
    
    if (!['tamil', 'english'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language. Must be "tamil" or "english"'
      });
    }
    
    const result = await settingsService.updateUserSettings(boatNumber, { language });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get notification settings
router.get('/:boatNumber/notifications', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const settings = await settingsService.getUserSettings(boatNumber);
    
    res.status(200).json({
      success: true,
      data: {
        notifications: settings.data.notifications,
        alertVolume: settings.data.alertVolume,
        emergencyAutoAlert: settings.data.emergencyAutoAlert
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update notification settings
router.put('/:boatNumber/notifications', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const { notifications, alertVolume, emergencyAutoAlert } = req.body;
    
    const updateData = {};
    if (typeof notifications === 'boolean') updateData.notifications = notifications;
    if (typeof alertVolume === 'number' && alertVolume >= 0 && alertVolume <= 100) {
      updateData.alertVolume = alertVolume;
    }
    if (typeof emergencyAutoAlert === 'boolean') updateData.emergencyAutoAlert = emergencyAutoAlert;
    
    const result = await settingsService.updateUserSettings(boatNumber, updateData);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 