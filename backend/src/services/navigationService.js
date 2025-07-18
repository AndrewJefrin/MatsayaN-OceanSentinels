const { db } = require('../config/firebase');
const { locationSchema } = require('../utils/validation');

class NavigationService {
  constructor() {
    // Initialize safe ports data
    this.safePorts = [
      {
        id: 'chennai',
        name: 'Chennai Port',
        tamilName: 'சென்னை துறைமுகம்',
        latitude: 13.0827,
        longitude: 80.2707,
        capacity: 100,
        isActive: true,
        facilities: ['fuel', 'repair', 'medical', 'emergency']
      },
      {
        id: 'tuticorin',
        name: 'Tuticorin Port',
        tamilName: 'தூத்துக்குடி துறைமுகம்',
        latitude: 8.7642,
        longitude: 78.1348,
        capacity: 80,
        isActive: true,
        facilities: ['fuel', 'repair', 'medical', 'emergency']
      },
      {
        id: 'enayam',
        name: 'Enayam Port',
        tamilName: 'எண்ணாயம் துறைமுகம்',
        latitude: 8.1833,
        longitude: 77.4167,
        capacity: 60,
        isActive: true,
        facilities: ['fuel', 'repair', 'emergency']
      },
      {
        id: 'kanyakumari',
        name: 'Kanyakumari Port',
        tamilName: 'கன்னியாகுமரி துறைமுகம்',
        latitude: 8.0883,
        longitude: 77.5385,
        capacity: 40,
        isActive: true,
        facilities: ['fuel', 'emergency']
      },
      {
        id: 'rameshwaram',
        name: 'Rameshwaram Port',
        tamilName: 'ராமேஸ்வரம் துறைமுகம்',
        latitude: 9.2881,
        longitude: 79.3129,
        capacity: 50,
        isActive: true,
        facilities: ['fuel', 'repair', 'emergency']
      }
    ];
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Calculate bearing between two points
  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = this.toRadians(lon2 - lon1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x);
    bearing = this.toDegrees(bearing);
    bearing = (bearing + 360) % 360;
    
    return bearing;
  }

  // Convert radians to degrees
  toDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  // Calculate ETA based on distance and boat speed
  calculateETA(distance, boatSpeed = 20) {
    const timeInHours = distance / boatSpeed;
    const timeInMinutes = timeInHours * 60;
    return Math.round(timeInMinutes);
  }

  // Find nearest safe port
  findNearestSafePort(latitude, longitude) {
    let nearestPort = null;
    let shortestDistance = Infinity;

    for (const port of this.safePorts) {
      if (!port.isActive) continue;

      const distance = this.calculateDistance(
        latitude, longitude,
        port.latitude, port.longitude
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestPort = port;
      }
    }

    return {
      port: nearestPort,
      distance: shortestDistance,
      bearing: nearestPort ? this.calculateBearing(
        latitude, longitude,
        nearestPort.latitude, nearestPort.longitude
      ) : 0,
      eta: this.calculateETA(shortestDistance)
    };
  }

  // Get all safe ports
  async getSafePorts() {
    try {
      // Try to get from Firestore first
      const portsSnapshot = await db.collection('safePorts').get();
      
      if (!portsSnapshot.empty) {
        const ports = portsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        return {
          success: true,
          data: ports
        };
      }

      // If no data in Firestore, use default data
      return {
        success: true,
        data: this.safePorts
      };
    } catch (error) {
      // Fallback to default data
      return {
        success: true,
        data: this.safePorts
      };
    }
  }

  // Update boat location
  async updateBoatLocation(boatNumber, locationData) {
    try {
      // Validate location data
      const { error, value } = locationSchema.validate(locationData);
      if (error) {
        throw new Error(`Location validation error: ${error.details[0].message}`);
      }

      // Update user's last known location
      const userSnapshot = await db.collection('users')
        .where('boatNumber', '==', boatNumber)
        .limit(1)
        .get();

      if (!userSnapshot.empty) {
        const userId = userSnapshot.docs[0].id;
        await db.collection('users').doc(userId).update({
          lastKnownLocation: {
            latitude: value.latitude,
            longitude: value.longitude,
            accuracy: value.accuracy,
            timestamp: value.timestamp
          }
        });
      }

      // Store location history
      await db.collection('boatLocations').doc(boatNumber).collection('history').add({
        ...value,
        boatNumber,
        timestamp: new Date()
      });

      // Calculate navigation data
      const navigationData = await this.calculateNavigationData(boatNumber, value);

      return {
        success: true,
        message: 'Location updated successfully',
        data: navigationData
      };
    } catch (error) {
      throw new Error(`Failed to update location: ${error.message}`);
    }
  }

  // Calculate navigation data for a boat
  async calculateNavigationData(boatNumber, location) {
    try {
      const { latitude, longitude } = location;

      // Find nearest safe port
      const nearestPort = this.findNearestSafePort(latitude, longitude);

      // Calculate distance to shore (simplified - using nearest port as shore reference)
      const distanceToShore = nearestPort.distance;

      // Get weather data for the location
      const weatherService = require('./weatherService');
      let weatherData = null;
      try {
        const weatherResult = await weatherService.fetchWeatherData(latitude, longitude);
        weatherData = weatherResult;
      } catch (error) {
        console.error('Failed to fetch weather data for navigation:', error);
      }

      const navigationData = {
        boatNumber,
        currentLocation: {
          latitude,
          longitude,
          timestamp: new Date()
        },
        nearestSafePort: nearestPort.port,
        distanceToShore: distanceToShore,
        distanceToNearestPort: nearestPort.distance,
        bearingToNearestPort: nearestPort.bearing,
        etaToNearestPort: nearestPort.eta,
        weatherData,
        calculatedAt: new Date()
      };

      // Store navigation data
      await db.collection('navigationData').doc(boatNumber).set(navigationData);

      return navigationData;
    } catch (error) {
      throw new Error(`Failed to calculate navigation data: ${error.message}`);
    }
  }

  // Get navigation data for a boat
  async getNavigationData(boatNumber) {
    try {
      const navDoc = await db.collection('navigationData').doc(boatNumber).get();

      if (!navDoc.exists) {
        throw new Error('Navigation data not found for this boat');
      }

      return {
        success: true,
        data: navDoc.data()
      };
    } catch (error) {
      throw new Error(`Failed to get navigation data: ${error.message}`);
    }
  }

  // Get boat location history
  async getBoatLocationHistory(boatNumber, limit = 50) {
    try {
      const historySnapshot = await db.collection('boatLocations')
        .doc(boatNumber)
        .collection('history')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const history = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: history
      };
    } catch (error) {
      throw new Error(`Failed to get location history: ${error.message}`);
    }
  }

  // Get all active boats locations (for map view)
  async getAllActiveBoatsLocations() {
    try {
      const usersSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .get();

      const boats = [];
      
      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        if (userData.lastKnownLocation) {
          boats.push({
            boatNumber: userData.boatNumber,
            username: userData.username,
            location: userData.lastKnownLocation,
            lastSeen: userData.lastKnownLocation.timestamp
          });
        }
      }

      return {
        success: true,
        data: boats
      };
    } catch (error) {
      throw new Error(`Failed to get active boats locations: ${error.message}`);
    }
  }

  // Add new safe port (admin function)
  async addSafePort(portData) {
    try {
      const port = {
        id: portData.id,
        name: portData.name,
        tamilName: portData.tamilName,
        latitude: portData.latitude,
        longitude: portData.longitude,
        capacity: portData.capacity,
        isActive: true,
        facilities: portData.facilities || [],
        createdAt: new Date()
      };

      await db.collection('safePorts').doc(port.id).set(port);

      return {
        success: true,
        message: 'Safe port added successfully',
        data: port
      };
    } catch (error) {
      throw new Error(`Failed to add safe port: ${error.message}`);
    }
  }

  // Update safe port
  async updateSafePort(portId, updateData) {
    try {
      await db.collection('safePorts').doc(portId).update({
        ...updateData,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Safe port updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update safe port: ${error.message}`);
    }
  }

  // Deactivate safe port
  async deactivateSafePort(portId) {
    try {
      await db.collection('safePorts').doc(portId).update({
        isActive: false,
        deactivatedAt: new Date()
      });

      return {
        success: true,
        message: 'Safe port deactivated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to deactivate safe port: ${error.message}`);
    }
  }

  // Calculate route between two points (simplified)
  calculateRoute(fromLat, fromLon, toLat, toLon) {
    const distance = this.calculateDistance(fromLat, fromLon, toLat, toLon);
    const bearing = this.calculateBearing(fromLat, fromLon, toLat, toLon);
    const eta = this.calculateETA(distance);

    return {
      distance,
      bearing,
      eta,
      waypoints: [
        { latitude: fromLat, longitude: fromLon },
        { latitude: toLat, longitude: toLon }
      ]
    };
  }
}

module.exports = new NavigationService(); 