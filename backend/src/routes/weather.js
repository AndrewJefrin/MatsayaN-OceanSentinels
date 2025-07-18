const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');
const { authenticateToken, requireBoatOwner } = require('../middleware/auth');

// Get weather data for a specific boat
router.get('/:boatNumber', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await weatherService.getWeatherData(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Update weather data for a boat (with location)
router.post('/:boatNumber/update', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Fetch weather data for the location
    const weatherData = await weatherService.fetchWeatherData(latitude, longitude);
    
    // Store weather data for the boat
    const result = await weatherService.storeWeatherData(boatNumber, weatherData);
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get weather forecast for a location
router.get('/forecast/:latitude/:longitude', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.params;
    const result = await weatherService.getWeatherForecast(parseFloat(latitude), parseFloat(longitude));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get weather alerts for a location
router.get('/alerts/:latitude/:longitude', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.params;
    const result = await weatherService.getWeatherAlerts(parseFloat(latitude), parseFloat(longitude));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get signal status for a boat
router.get('/:boatNumber/signal', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const weatherResult = await weatherService.getWeatherData(boatNumber);
    
    res.status(200).json({
      success: true,
      data: weatherResult.signalStatus
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Get current weather for a location (public endpoint)
router.get('/current/:latitude/:longitude', async (req, res) => {
  try {
    const { latitude, longitude } = req.params;
    const weatherData = await weatherService.fetchWeatherData(parseFloat(latitude), parseFloat(longitude));
    
    res.status(200).json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 