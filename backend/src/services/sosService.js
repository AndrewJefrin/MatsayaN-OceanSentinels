const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const nodemailer = require('nodemailer');

class SOSService {
  constructor() {
    this.emergencyNumbers = {
      coastGuard: '+91-1800-425-3784',
      marinePolice: '+91-044-2345-6789',
      fisheriesDepartment: '+91-044-2345-6790'
    };
  }

  // Create SOS emergency alert
  async createSOSAlert(boatNumber, location, message = '', userId = null) {
    try {
      // Get user details
      const userData = await this.getUserByBoatNumber(boatNumber);
      if (!userData) {
        throw new Error('Boat not found');
      }

      const sosAlert = {
        id: uuidv4(),
        boatNumber,
        userId: userId || userData.uid,
        username: userData.username,
        phoneNumber: userData.phoneNumber,
        location: {
          latitude: location.latitude || 0,
          longitude: location.longitude || 0,
          accuracy: location.accuracy || 0,
          timestamp: new Date()
        },
        message: message || 'Emergency SOS signal sent',
        status: 'active',
        priority: 'critical',
        createdAt: new Date(),
        updatedAt: new Date(),
        emergencyContacts: userData.emergencyContacts || [],
        responseTime: null,
        resolvedAt: null,
        resolvedBy: null,
        notes: []
      };

      // Store SOS alert
      await db.collection('sosAlerts').add(sosAlert);

      // Send notifications
      await Promise.all([
        this.notifyEmergencyContacts(sosAlert),
        this.notifyAuthorities(sosAlert),
        this.notifyNearbyBoats(sosAlert),
        this.createVoiceAlert(sosAlert)
      ]);

      // Log SOS activity
      await this.logSOSActivity(sosAlert);

      return {
        success: true,
        message: 'SOS emergency alert created and notifications sent',
        data: sosAlert
      };
    } catch (error) {
      throw new Error(`SOS alert creation failed: ${error.message}`);
    }
  }

  // Get user by boat number
  async getUserByBoatNumber(boatNumber) {
    try {
      const userSnapshot = await db.collection('users')
        .where('boatNumber', '==', boatNumber)
        .limit(1)
        .get();

      if (userSnapshot.empty) {
        return null;
      }

      return userSnapshot.docs[0].data();
    } catch (error) {
      console.error('Error getting user by boat number:', error);
      return null;
    }
  }

  // Notify emergency contacts
  async notifyEmergencyContacts(sosAlert) {
    try {
      const { emergencyContacts, username, boatNumber, location, message } = sosAlert;
      
      if (!emergencyContacts || emergencyContacts.length === 0) {
        console.log(`No emergency contacts found for boat ${boatNumber}`);
        return;
      }

      const notificationPromises = emergencyContacts.map(async (contact) => {
        try {
          // Send SMS
          if (contact.phoneNumber) {
            await this.sendSMS(contact.phoneNumber, this.generateSOSMessage(sosAlert));
          }

          // Send email
          if (contact.email) {
            await this.sendEmail(contact.email, this.generateSOSEmail(sosAlert));
          }

          // Log notification
          await this.logEmergencyContactNotification(sosAlert.id, contact, 'sent');
        } catch (error) {
          console.error(`Failed to notify emergency contact ${contact.name}:`, error);
          await this.logEmergencyContactNotification(sosAlert.id, contact, 'failed', error.message);
        }
      });

      await Promise.all(notificationPromises);
      console.log(`Emergency contacts notified for SOS alert ${sosAlert.id}`);
    } catch (error) {
      console.error('Error notifying emergency contacts:', error);
    }
  }

  // Send SMS notification
  async sendSMS(phoneNumber, message) {
    try {
      // Check if Twilio is configured
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.log('Twilio not configured, SMS not sent');
        return;
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      
      const response = await axios.post(twilioUrl, {
        To: phoneNumber,
        From: process.env.TWILIO_PHONE_NUMBER,
        Body: message
      }, {
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID,
          password: process.env.TWILIO_AUTH_TOKEN
        }
      });

      console.log(`SMS sent to ${phoneNumber}:`, response.data.sid);
      return response.data.sid;
    } catch (error) {
      console.error(`SMS sending failed to ${phoneNumber}:`, error.message);
      throw error;
    }
  }

  // Send email notification
  async sendEmail(email, emailData) {
    try {
      // Check if email is configured
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.log('Email not configured, email not sent');
        return;
      }

      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email}:`, info.messageId);
      return info.messageId;
    } catch (error) {
      console.error(`Email sending failed to ${email}:`, error.message);
      throw error;
    }
  }

  // Generate SMS message
  generateSOSMessage(sosAlert) {
    const { username, boatNumber, location, message } = sosAlert;
    const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    
    return `🚨 SOS EMERGENCY 🚨
    
Fisherman: ${username}
Boat: ${boatNumber}
Location: ${locationUrl}
Message: ${message}

Please respond immediately!
Uyir Kavalan Emergency System`;
  }

  // Generate email content
  generateSOSEmail(sosAlert) {
    const { username, boatNumber, location, message, createdAt } = sosAlert;
    const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    
    return {
      subject: `🚨 SOS Emergency Alert - Boat ${boatNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
            <h1>🚨 SOS EMERGENCY ALERT 🚨</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f8f9fa;">
            <h2>Emergency Details</h2>
            <p><strong>Fisherman:</strong> ${username}</p>
            <p><strong>Boat Number:</strong> ${boatNumber}</p>
            <p><strong>Location:</strong> <a href="${locationUrl}">View on Map</a></p>
            <p><strong>Coordinates:</strong> ${location.latitude}, ${location.longitude}</p>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Time:</strong> ${createdAt.toLocaleString()}</p>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h3>⚠️ IMMEDIATE ACTION REQUIRED</h3>
              <p>Please contact the fisherman immediately and verify their safety.</p>
            </div>
            
            <p>This is an automated emergency alert from the Uyir Kavalan Fishermen Safety System.</p>
          </div>
        </div>
      `,
      text: `SOS EMERGENCY ALERT\n\nFisherman: ${username}\nBoat: ${boatNumber}\nLocation: ${locationUrl}\nMessage: ${message}\nTime: ${createdAt.toLocaleString()}\n\nPlease respond immediately!`
    };
  }

  // Notify authorities
  async notifyAuthorities(sosAlert) {
    try {
      const { boatNumber, location, username } = sosAlert;
      
      // Notify Coast Guard
      await this.sendSMS(this.emergencyNumbers.coastGuard, 
        `SOS Alert: Boat ${boatNumber} (${username}) at ${location.latitude},${location.longitude}`);

      // Notify Marine Police
      await this.sendSMS(this.emergencyNumbers.marinePolice,
        `SOS Alert: Boat ${boatNumber} (${username}) at ${location.latitude},${location.longitude}`);

      console.log('Authorities notified for SOS alert');
    } catch (error) {
      console.error('Error notifying authorities:', error);
    }
  }

  // Notify nearby boats
  async notifyNearbyBoats(sosAlert) {
    try {
      const { location, boatNumber } = sosAlert;
      
      // Get boats within 10km radius (simplified)
      const nearbyBoats = await this.getNearbyBoats(location, 10);
      
      const notificationPromises = nearbyBoats.map(async (boat) => {
        if (boat.boatNumber !== boatNumber) {
          await this.sendSOSToBoat(boat.boatNumber, sosAlert);
        }
      });

      await Promise.all(notificationPromises);
      console.log(`Nearby boats notified for SOS alert`);
    } catch (error) {
      console.error('Error notifying nearby boats:', error);
    }
  }

  // Get nearby boats (simplified implementation)
  async getNearbyBoats(location, radiusKm) {
    try {
      // In production, use proper geospatial queries
      // For now, get all active boats
      const boatsSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .where('role', '==', 'fisherman')
        .get();

      return boatsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting nearby boats:', error);
      return [];
    }
  }

  // Send SOS to specific boat
  async sendSOSToBoat(boatNumber, sosAlert) {
    try {
      const boatAlert = {
        ...sosAlert,
        type: 'sos_nearby',
        receivedAt: new Date()
      };

      await db.collection('boatAlerts')
        .doc(boatNumber)
        .collection('alerts')
        .add(boatAlert);
    } catch (error) {
      console.error(`Failed to send SOS to boat ${boatNumber}:`, error);
    }
  }

  // Create voice alert
  async createVoiceAlert(sosAlert) {
    try {
      const voiceText = `அவசர SOS சிக்னல். படகு ${sosAlert.boatNumber} இருந்து. உதவி தேவை. அவசரமாக பதிலளிக்கவும்.`;
      
      // Store voice alert reference
      await db.collection('sosAlerts').doc(sosAlert.id).update({
        voiceText,
        voiceGenerated: true
      });
    } catch (error) {
      console.error('Error creating voice alert:', error);
    }
  }

  // Log SOS activity
  async logSOSActivity(sosAlert) {
    try {
      await db.collection('sosLogs').add({
        sosId: sosAlert.id,
        boatNumber: sosAlert.boatNumber,
        action: 'created',
        timestamp: new Date(),
        details: sosAlert
      });
    } catch (error) {
      console.error('Error logging SOS activity:', error);
    }
  }

  // Log emergency contact notification
  async logEmergencyContactNotification(sosId, contact, status, error = null) {
    try {
      await db.collection('sosLogs').add({
        sosId,
        action: 'emergency_contact_notification',
        contact: {
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          email: contact.email
        },
        status,
        error,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging emergency contact notification:', error);
    }
  }

  // Get SOS alerts for a boat
  async getSOSAlerts(boatNumber) {
    try {
      const sosSnapshot = await db.collection('sosAlerts')
        .where('boatNumber', '==', boatNumber)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const alerts = sosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: alerts
      };
    } catch (error) {
      throw new Error(`Failed to get SOS alerts: ${error.message}`);
    }
  }

  // Resolve SOS alert
  async resolveSOSAlert(sosId, resolvedBy, notes = '') {
    try {
      await db.collection('sosAlerts').doc(sosId).update({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy,
        notes: notes,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'SOS alert resolved successfully'
      };
    } catch (error) {
      throw new Error(`Failed to resolve SOS alert: ${error.message}`);
    }
  }

  // Get active SOS alerts (admin function)
  async getActiveSOSAlerts() {
    try {
      const sosSnapshot = await db.collection('sosAlerts')
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .get();

      const alerts = sosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: alerts
      };
    } catch (error) {
      throw new Error(`Failed to get active SOS alerts: ${error.message}`);
    }
  }
}

module.exports = new SOSService(); 