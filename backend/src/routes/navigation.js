const express = require('express');
const router = express.Router();
const navigationService = require('../services/navigationService');
const { authenticateToken, requireBoatOwner, requireAdmin } = require('../middleware/auth');

// Get all safe ports
router.get('/ports', async (req, res) => {
  try {
    const result = await navigationService.getSafePorts();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update boat location
router.post('/:boatNumber/location', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await navigationService.updateBoatLocation(boatNumber, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get navigation data for a boat
router.get('/:boatNumber/navigation', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await navigationService.getNavigationData(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Get boat location history
router.get('/:boatNumber/history', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const { limit = 50 } = req.query;
    const result = await navigationService.getBoatLocationHistory(boatNumber, parseInt(limit));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all active boats locations (for map view)
router.get('/boats/locations', authenticateToken, async (req, res) => {
  try {
    const result = await navigationService.getAllActiveBoatsLocations();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Calculate route between two points
router.post('/route', authenticateToken, async (req, res) => {
  try {
    const { fromLat, fromLon, toLat, toLon } = req.body;
    
    if (!fromLat || !fromLon || !toLat || !toLon) {
      return res.status(400).json({
        success: false,
        message: 'All coordinates are required'
      });
    }

    const route = navigationService.calculateRoute(
      parseFloat(fromLat),
      parseFloat(fromLon),
      parseFloat(toLat),
      parseFloat(toLon)
    );

    res.status(200).json({
      success: true,
      data: route
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Find nearest safe port for a location
router.post('/nearest-port', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const nearestPort = navigationService.findNearestSafePort(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    res.status(200).json({
      success: true,
      data: nearestPort
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add new safe port (admin only)
router.post('/ports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await navigationService.addSafePort(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update safe port (admin only)
router.put('/ports/:portId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { portId } = req.params;
    const result = await navigationService.updateSafePort(portId, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Deactivate safe port (admin only)
router.put('/ports/:portId/deactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { portId } = req.params;
    const result = await navigationService.deactivateSafePort(portId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get navigation statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [ports, boats] = await Promise.all([
      navigationService.getSafePorts(),
      navigationService.getAllActiveBoatsLocations()
    ]);

    const activePorts = ports.data.filter(port => port.isActive).length;
    const activeBoats = boats.data.length;

    res.status(200).json({
      success: true,
      data: {
        totalPorts: ports.data.length,
        activePorts,
        inactivePorts: ports.data.length - activePorts,
        activeBoats,
        totalBoatsWithLocation: boats.data.filter(boat => boat.location).length
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