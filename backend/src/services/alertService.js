const gtts = require('gtts');
const { db, bucket } = require('../config/firebase');
const { alertSchema } = require('../utils/validation');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

class AlertService {
  constructor() {
    this.voiceCache = new Map();
  }

  // Create a new alert
  async createAlert(alertData) {
    try {
      // Validate alert data
      const { error, value } = alertSchema.validate(alertData);
      if (error) {
        throw new Error(`Alert validation error: ${error.details[0].message}`);
      }

      // Generate Tamil voice alert
      const voiceUrl = await this.generateTamilVoiceAlert(value.voiceAlertText);

      const alert = {
        id: uuidv4(),
        ...value,
        voiceUrl,
        createdAt: new Date(),
        isActive: true,
        acknowledgedBy: []
      };

      // Store alert in Firestore
      await db.collection('alerts').add(alert);

      // Send alert to affected boats
      await this.sendAlertToBoats(alert);

      return {
        success: true,
        message: 'Alert created successfully',
        data: alert
      };
    } catch (error) {
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  }

  // Generate Tamil voice alert using Google TTS
  async generateTamilVoiceAlert(text) {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(text);
      if (this.voiceCache.has(cacheKey)) {
        return this.voiceCache.get(cacheKey);
      }

      // Create temporary file
      const tempDir = os.tmpdir();
      const fileName = `alert_${uuidv4()}.mp3`;
      const filePath = path.join(tempDir, fileName);

      // Generate speech
      const gttsInstance = new gtts(text, 'ta'); // 'ta' is Tamil language code
      
      return new Promise((resolve, reject) => {
        gttsInstance.save(filePath, async (err) => {
          if (err) {
            reject(new Error(`Failed to generate voice alert: ${err.message}`));
            return;
          }

          try {
            // Upload to Firebase Storage
            const storageFileName = `voice-alerts/${fileName}`;
            await bucket.upload(filePath, {
              destination: storageFileName,
              metadata: {
                contentType: 'audio/mpeg',
                metadata: {
                  text,
                  language: 'tamil',
                  generatedAt: new Date().toISOString()
                }
              }
            });

            // Get download URL
            const file = bucket.file(storageFileName);
            const [url] = await file.getSignedUrl({
              action: 'read',
              expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Clean up temporary file
            await fs.unlink(filePath);

            // Cache the URL
            this.voiceCache.set(cacheKey, url);
            resolve(url);
          } catch (uploadError) {
            // Clean up temporary file
            try {
              await fs.unlink(filePath);
            } catch (cleanupError) {
              console.error('Failed to cleanup temp file:', cleanupError);
            }
            reject(new Error(`Failed to upload voice alert: ${uploadError.message}`));
          }
        });
      });
    } catch (error) {
      throw new Error(`Voice alert generation failed: ${error.message}`);
    }
  }

  // Generate cache key for voice alerts
  generateCacheKey(text) {
    return Buffer.from(text).toString('base64').substring(0, 32);
  }

  // Send alert to affected boats
  async sendAlertToBoats(alert) {
    try {
      // Get all active boats
      const usersSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .get();

      const alertPromises = usersSnapshot.docs.map(async (doc) => {
        const userData = doc.data();
        const boatNumber = userData.boatNumber;

        // Check if boat is in affected area (simplified check)
        if (this.isBoatInAffectedArea(userData, alert.affectedAreas)) {
          await this.sendAlertToBoat(boatNumber, alert);
        }
      });

      await Promise.all(alertPromises);
      console.log(`Alert sent to affected boats`);
    } catch (error) {
      console.error('Error sending alert to boats:', error);
    }
  }

  // Check if boat is in affected area
  isBoatInAffectedArea(userData, affectedAreas) {
    // This is a simplified check
    // In production, implement proper geographical area checking
    if (!userData.lastKnownLocation) return false;
    
    // For now, assume all boats in Tamil Nadu are affected
    // In real implementation, use proper geospatial queries
    return true;
  }

  // Send alert to specific boat
  async sendAlertToBoat(boatNumber, alert) {
    try {
      const boatAlert = {
        ...alert,
        boatNumber,
        sentAt: new Date(),
        isRead: false,
        isAcknowledged: false
      };

      await db.collection('boatAlerts').doc(boatNumber).collection('alerts').add(boatAlert);
    } catch (error) {
      console.error(`Failed to send alert to boat ${boatNumber}:`, error);
    }
  }

  // Get alerts for a specific boat
  async getBoatAlerts(boatNumber) {
    try {
      const alertsSnapshot = await db.collection('boatAlerts')
        .doc(boatNumber)
        .collection('alerts')
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const alerts = alertsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: alerts
      };
    } catch (error) {
      throw new Error(`Failed to get boat alerts: ${error.message}`);
    }
  }

  // Acknowledge alert
  async acknowledgeAlert(boatNumber, alertId) {
    try {
      await db.collection('boatAlerts')
        .doc(boatNumber)
        .collection('alerts')
        .doc(alertId)
        .update({
          isAcknowledged: true,
          acknowledgedAt: new Date()
        });

      return {
        success: true,
        message: 'Alert acknowledged successfully'
      };
    } catch (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }
  }

  // Mark alert as read
  async markAlertAsRead(boatNumber, alertId) {
    try {
      await db.collection('boatAlerts')
        .doc(boatNumber)
        .collection('alerts')
        .doc(alertId)
        .update({
          isRead: true,
          readAt: new Date()
        });

      return {
        success: true,
        message: 'Alert marked as read'
      };
    } catch (error) {
      throw new Error(`Failed to mark alert as read: ${error.message}`);
    }
  }

  // Create emergency SOS alert
  async createSOSAlert(boatNumber, location, message = '') {
    try {
      const sosAlert = {
        id: uuidv4(),
        type: 'emergency',
        severity: 'critical',
        title: 'SOS Emergency Alert',
        description: `Emergency SOS signal from boat ${boatNumber}. ${message}`,
        affectedAreas: ['Tamil Nadu Coast'],
        estimatedTime: new Date(),
        recommendedActions: [
          'Contact Coast Guard immediately',
          'Send rescue team to location',
          'Alert nearby boats for assistance'
        ],
        voiceAlertText: `அவசர SOS சிக்னல். படகு ${boatNumber} இருந்து. உதவி தேவை.`,
        location,
        boatNumber,
        createdAt: new Date(),
        isActive: true,
        isSOS: true
      };

      // Generate voice alert
      sosAlert.voiceUrl = await this.generateTamilVoiceAlert(sosAlert.voiceAlertText);

      // Store SOS alert
      await db.collection('sosAlerts').add(sosAlert);

      // Send to emergency contacts
      await this.sendSOSToEmergencyContacts(boatNumber, sosAlert);

      // Send to admin dashboard
      await this.sendSOSToAdmin(sosAlert);

      return {
        success: true,
        message: 'SOS alert created successfully',
        data: sosAlert
      };
    } catch (error) {
      throw new Error(`Failed to create SOS alert: ${error.message}`);
    }
  }

  // Send SOS to emergency contacts
  async sendSOSToEmergencyContacts(boatNumber, sosAlert) {
    try {
      const userDoc = await db.collection('users')
        .where('boatNumber', '==', boatNumber)
        .limit(1)
        .get();

      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        const emergencyContacts = userData.emergencyContacts || [];

        // In production, integrate with SMS/email service
        console.log(`SOS sent to emergency contacts for boat ${boatNumber}:`, emergencyContacts);
      }
    } catch (error) {
      console.error('Error sending SOS to emergency contacts:', error);
    }
  }

  // Send SOS to admin dashboard
  async sendSOSToAdmin(sosAlert) {
    try {
      // Store in admin alerts collection
      await db.collection('adminAlerts').add({
        ...sosAlert,
        status: 'pending',
        assignedTo: null,
        responseTime: null
      });
    } catch (error) {
      console.error('Error sending SOS to admin:', error);
    }
  }

  // Test voice alert endpoint
  async testVoiceAlert(boatNumber) {
    try {
      const testText = `சோதனை எச்சரிக்கை. படகு ${boatNumber} இருந்து. இது ஒரு சோதனை செய்தி மட்டும்.`;
      
      const voiceUrl = await this.generateTamilVoiceAlert(testText);

      return {
        success: true,
        message: 'Test voice alert generated successfully',
        data: {
          text: testText,
          voiceUrl,
          boatNumber
        }
      };
    } catch (error) {
      throw new Error(`Test voice alert failed: ${error.message}`);
    }
  }

  // Get all active alerts (admin function)
  async getAllActiveAlerts() {
    try {
      const alertsSnapshot = await db.collection('alerts')
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();

      const alerts = alertsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: alerts
      };
    } catch (error) {
      throw new Error(`Failed to get active alerts: ${error.message}`);
    }
  }

  // Deactivate alert
  async deactivateAlert(alertId) {
    try {
      await db.collection('alerts').doc(alertId).update({
        isActive: false,
        deactivatedAt: new Date()
      });

      return {
        success: true,
        message: 'Alert deactivated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to deactivate alert: ${error.message}`);
    }
  }
}

module.exports = new AlertService(); 