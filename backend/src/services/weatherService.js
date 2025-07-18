const axios = require('axios');
const { db } = require('../config/firebase');
const { weatherDataSchema } = require('../utils/validation');

class WeatherService {
  constructor() {
    this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
    this.weatherNewsApiKey = process.env.WEATHER_NEWS_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  // Fetch weather data from OpenWeatherMap API
  async fetchWeatherData(latitude, longitude) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: this.openWeatherApiKey,
          units: 'metric'
        }
      });

      const data = response.data;
      
      // Extract relevant weather information
      const weatherData = {
        windSpeed: data.wind?.speed || 0,
        windDirection: data.wind?.deg || 0,
        temperature: data.main?.temp || 0,
        humidity: data.main?.humidity || 0,
        pressure: data.main?.pressure || 0,
        visibility: (data.visibility || 0) / 1000, // Convert to km
        seaCondition: this.calculateSeaCondition(data.wind?.speed || 0, data.weather?.[0]?.main || 'Clear'),
        tideSpeed: await this.getTideSpeed(latitude, longitude),
        latitude,
        longitude,
        timestamp: new Date(),
        weatherDescription: data.weather?.[0]?.description || 'Unknown',
        weatherIcon: data.weather?.[0]?.icon || '01d'
      };

      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  // Calculate sea condition based on wind speed and weather
  calculateSeaCondition(windSpeed, weatherType) {
    if (windSpeed < 5) return 'calm';
    if (windSpeed < 10) return 'slight';
    if (windSpeed < 20) return 'moderate';
    if (windSpeed < 30) return 'rough';
    if (windSpeed < 40) return 'very_rough';
    return 'high';
  }

  // Get tide speed (simplified calculation - in real implementation, use tide API)
  async getTideSpeed(latitude, longitude) {
    // This is a simplified calculation
    // In production, integrate with a tide prediction API
    const hour = new Date().getHours();
    const tideSpeed = Math.sin((hour / 24) * 2 * Math.PI) * 2 + 1; // Simulated tide speed
    return Math.abs(tideSpeed);
  }

  // Calculate signal status based on weather conditions
  calculateSignalStatus(weatherData) {
    const { windSpeed, seaCondition, visibility, temperature } = weatherData;
    
    let riskScore = 0;
    let reasons = [];

    // Wind speed assessment
    if (windSpeed > 40) {
      riskScore += 100;
      reasons.push('Extreme wind conditions');
    } else if (windSpeed > 30) {
      riskScore += 80;
      reasons.push('High wind conditions');
    } else if (windSpeed > 20) {
      riskScore += 60;
      reasons.push('Moderate wind conditions');
    } else if (windSpeed > 10) {
      riskScore += 30;
      reasons.push('Light wind conditions');
    }

    // Sea condition assessment
    if (seaCondition === 'high') {
      riskScore += 100;
      reasons.push('Dangerous sea conditions');
    } else if (seaCondition === 'very_rough') {
      riskScore += 80;
      reasons.push('Very rough sea conditions');
    } else if (seaCondition === 'rough') {
      riskScore += 60;
      reasons.push('Rough sea conditions');
    } else if (seaCondition === 'moderate') {
      riskScore += 40;
      reasons.push('Moderate sea conditions');
    }

    // Visibility assessment
    if (visibility < 1) {
      riskScore += 70;
      reasons.push('Poor visibility');
    } else if (visibility < 5) {
      riskScore += 40;
      reasons.push('Reduced visibility');
    }

    // Temperature assessment (for extreme conditions)
    if (temperature < 0 || temperature > 45) {
      riskScore += 30;
      reasons.push('Extreme temperature conditions');
    }

    // Determine signal level
    let signalLevel, color;
    if (riskScore >= 150) {
      signalLevel = 'red';
      color = '#FF4444';
    } else if (riskScore >= 100) {
      signalLevel = 'yellow';
      color = '#FFAA00';
    } else {
      signalLevel = 'green';
      color = '#44FF44';
    }

    return {
      level: signalLevel,
      color,
      riskScore,
      reasons,
      timestamp: new Date()
    };
  }

  // Store weather data for a specific boat
  async storeWeatherData(boatNumber, weatherData) {
    try {
      // Validate weather data
      const { error } = weatherDataSchema.validate(weatherData);
      if (error) {
        throw new Error(`Weather data validation error: ${error.details[0].message}`);
      }

      // Store weather data
      await db.collection('weatherData').doc(boatNumber).set(weatherData);

      // Calculate and store signal status
      const signalStatus = this.calculateSignalStatus(weatherData);
      await db.collection('signalStatus').doc(boatNumber).set(signalStatus);

      return {
        success: true,
        weatherData,
        signalStatus
      };
    } catch (error) {
      console.error('Error storing weather data:', error);
      throw new Error(`Failed to store weather data: ${error.message}`);
    }
  }

  // Get weather data for a specific boat
  async getWeatherData(boatNumber) {
    try {
      const weatherDoc = await db.collection('weatherData').doc(boatNumber).get();
      const signalDoc = await db.collection('signalStatus').doc(boatNumber).get();

      if (!weatherDoc.exists) {
        throw new Error('Weather data not found for this boat');
      }

      return {
        success: true,
        weatherData: weatherDoc.data(),
        signalStatus: signalDoc.exists ? signalDoc.data() : null
      };
    } catch (error) {
      throw new Error(`Failed to get weather data: ${error.message}`);
    }
  }

  // Get weather forecast (next 5 days)
  async getWeatherForecast(latitude, longitude) {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: this.openWeatherApiKey,
          units: 'metric'
        }
      });

      const forecast = response.data.list.map(item => ({
        timestamp: new Date(item.dt * 1000),
        temperature: item.main.temp,
        humidity: item.main.humidity,
        windSpeed: item.wind?.speed || 0,
        windDirection: item.wind?.deg || 0,
        weatherDescription: item.weather?.[0]?.description || 'Unknown',
        weatherIcon: item.weather?.[0]?.icon || '01d'
      }));

      return {
        success: true,
        forecast
      };
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw new Error('Failed to fetch weather forecast');
    }
  }

  // Get weather alerts from Weather News API
  async getWeatherAlerts(latitude, longitude) {
    try {
      if (!this.weatherNewsApiKey) {
        console.warn('Weather News API key not configured');
        return { success: true, alerts: [] };
      }

      const response = await axios.get('https://api.weatherapi.com/v1/alerts.json', {
        params: {
          key: this.weatherNewsApiKey,
          q: `${latitude},${longitude}`,
          aqi: 'no'
        }
      });

      const alerts = response.data.alerts?.alert || [];
      
      return {
        success: true,
        alerts: alerts.map(alert => ({
          headline: alert.headline,
          severity: alert.severity,
          areas: alert.areas,
          event: alert.event,
          effective: alert.effective,
          expires: alert.expires,
          description: alert.desc
        }))
      };
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      return { success: true, alerts: [] };
    }
  }

  // Update weather data for all active boats (scheduled task)
  async updateAllBoatsWeather() {
    try {
      const usersSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .get();

      const updatePromises = usersSnapshot.docs.map(async (doc) => {
        const userData = doc.data();
        if (userData.lastKnownLocation) {
          try {
            const weatherData = await this.fetchWeatherData(
              userData.lastKnownLocation.latitude,
              userData.lastKnownLocation.longitude
            );
            await this.storeWeatherData(userData.boatNumber, weatherData);
          } catch (error) {
            console.error(`Failed to update weather for boat ${userData.boatNumber}:`, error);
          }
        }
      });

      await Promise.all(updatePromises);
      console.log('Weather data updated for all active boats');
    } catch (error) {
      console.error('Error updating weather for all boats:', error);
    }
  }
}

module.exports = new WeatherService(); 