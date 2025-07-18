const { db } = require('../config/firebase');
const { settingsSchema, emergencyContactSchema } = require('../utils/validation');
const { v4: uuidv4 } = require('uuid');

class SettingsService {
  // Get user settings
  async getUserSettings(boatNumber) {
    try {
      const settingsDoc = await db.collection('settings').doc(boatNumber).get();
      
      if (settingsDoc.exists) {
        return {
          success: true,
          data: settingsDoc.data()
        };
      }

      // Return default settings if none exist
      const defaultSettings = {
        language: 'tamil',
        alertVolume: 80,
        notifications: true,
        autoLocation: true,
        loraEnabled: true,
        emergencyAutoAlert: true,
        theme: 'light',
        autoSync: true,
        dataUsage: 'normal', // low, normal, high
        batteryOptimization: true,
        createdAt: new Date()
      };

      // Create default settings
      await db.collection('settings').doc(boatNumber).set(defaultSettings);

      return {
        success: true,
        data: defaultSettings
      };
    } catch (error) {
      throw new Error(`Failed to get user settings: ${error.message}`);
    }
  }

  // Update user settings
  async updateUserSettings(boatNumber, settingsData) {
    try {
      // Validate settings data
      const { error, value } = settingsSchema.validate(settingsData);
      if (error) {
        throw new Error(`Settings validation error: ${error.details[0].message}`);
      }

      // Update settings
      await db.collection('settings').doc(boatNumber).update({
        ...value,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Settings updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  }

  // Get emergency contacts for a boat
  async getEmergencyContacts(boatNumber) {
    try {
      const contactsSnapshot = await db.collection('emergencyContacts')
        .doc(boatNumber)
        .collection('contacts')
        .orderBy('isPrimary', 'desc')
        .orderBy('name', 'asc')
        .get();

      const contacts = contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: contacts
      };
    } catch (error) {
      throw new Error(`Failed to get emergency contacts: ${error.message}`);
    }
  }

  // Add emergency contact
  async addEmergencyContact(boatNumber, contactData) {
    try {
      // Validate contact data
      const { error, value } = emergencyContactSchema.validate(contactData);
      if (error) {
        throw new Error(`Contact validation error: ${error.details[0].message}`);
      }

      const contact = {
        id: uuidv4(),
        ...value,
        createdAt: new Date()
      };

      // If this is the first contact, make it primary
      const existingContacts = await this.getEmergencyContacts(boatNumber);
      if (existingContacts.data.length === 0) {
        contact.isPrimary = true;
      }

      // If this contact is primary, unset other primary contacts
      if (contact.isPrimary) {
        await this.unsetOtherPrimaryContacts(boatNumber);
      }

      await db.collection('emergencyContacts')
        .doc(boatNumber)
        .collection('contacts')
        .doc(contact.id)
        .set(contact);

      return {
        success: true,
        message: 'Emergency contact added successfully',
        data: contact
      };
    } catch (error) {
      throw new Error(`Failed to add emergency contact: ${error.message}`);
    }
  }

  // Update emergency contact
  async updateEmergencyContact(boatNumber, contactId, contactData) {
    try {
      // Validate contact data
      const { error, value } = emergencyContactSchema.validate(contactData);
      if (error) {
        throw new Error(`Contact validation error: ${error.details[0].message}`);
      }

      // If this contact is being made primary, unset other primary contacts
      if (value.isPrimary) {
        await this.unsetOtherPrimaryContacts(boatNumber, contactId);
      }

      await db.collection('emergencyContacts')
        .doc(boatNumber)
        .collection('contacts')
        .doc(contactId)
        .update({
          ...value,
          updatedAt: new Date()
        });

      return {
        success: true,
        message: 'Emergency contact updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update emergency contact: ${error.message}`);
    }
  }

  // Delete emergency contact
  async deleteEmergencyContact(boatNumber, contactId) {
    try {
      const contactDoc = await db.collection('emergencyContacts')
        .doc(boatNumber)
        .collection('contacts')
        .doc(contactId)
        .get();

      if (!contactDoc.exists) {
        throw new Error('Emergency contact not found');
      }

      const contactData = contactDoc.data();

      // Delete the contact
      await db.collection('emergencyContacts')
        .doc(boatNumber)
        .collection('contacts')
        .doc(contactId)
        .delete();

      // If this was the primary contact, make another contact primary
      if (contactData.isPrimary) {
        await this.setNewPrimaryContact(boatNumber);
      }

      return {
        success: true,
        message: 'Emergency contact deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete emergency contact: ${error.message}`);
    }
  }

  // Unset other primary contacts
  async unsetOtherPrimaryContacts(boatNumber, excludeContactId = null) {
    try {
      const contactsSnapshot = await db.collection('emergencyContacts')
        .doc(boatNumber)
        .collection('contacts')
        .where('isPrimary', '==', true)
        .get();

      const updatePromises = contactsSnapshot.docs.map(doc => {
        if (doc.id !== excludeContactId) {
          return doc.ref.update({
            isPrimary: false,
            updatedAt: new Date()
          });
        }
      });

      await Promise.all(updatePromises.filter(Boolean));
    } catch (error) {
      console.error('Failed to unset other primary contacts:', error);
    }
  }

  // Set new primary contact
  async setNewPrimaryContact(boatNumber) {
    try {
      const contactsSnapshot = await db.collection('emergencyContacts')
        .doc(boatNumber)
        .collection('contacts')
        .orderBy('createdAt', 'asc')
        .limit(1)
        .get();

      if (!contactsSnapshot.empty) {
        await contactsSnapshot.docs[0].ref.update({
          isPrimary: true,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to set new primary contact:', error);
    }
  }

  // Get app configuration
  async getAppConfiguration() {
    try {
      const configDoc = await db.collection('appConfiguration').doc('main').get();
      
      if (configDoc.exists) {
        return {
          success: true,
          data: configDoc.data()
        };
      }

      // Return default configuration
      const defaultConfig = {
        appVersion: '1.0.0',
        minAppVersion: '1.0.0',
        maintenanceMode: false,
        maintenanceMessage: '',
        features: {
          voiceAlerts: true,
          loraCommunication: true,
          weatherAlerts: true,
          navigation: true,
          emergencySOS: true
        },
        apiEndpoints: {
          weather: process.env.OPENWEATHER_API_URL || 'https://api.openweathermap.org/data/2.5',
          maps: 'https://api.mapbox.com',
          voice: 'https://text-to-speech.googleapis.com'
        },
        limits: {
          maxEmergencyContacts: 5,
          maxChatHistory: 1000,
          maxLocationHistory: 500,
          maxVoiceAlerts: 50
        },
        updatedAt: new Date()
      };

      // Create default configuration
      await db.collection('appConfiguration').doc('main').set(defaultConfig);

      return {
        success: true,
        data: defaultConfig
      };
    } catch (error) {
      throw new Error(`Failed to get app configuration: ${error.message}`);
    }
  }

  // Update app configuration (admin function)
  async updateAppConfiguration(configData) {
    try {
      await db.collection('appConfiguration').doc('main').update({
        ...configData,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'App configuration updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update app configuration: ${error.message}`);
    }
  }

  // Get user preferences summary
  async getUserPreferencesSummary(boatNumber) {
    try {
      const [settings, contacts, userDoc] = await Promise.all([
        this.getUserSettings(boatNumber),
        this.getEmergencyContacts(boatNumber),
        db.collection('users').where('boatNumber', '==', boatNumber).limit(1).get()
      ]);

      const userData = userDoc.empty ? null : userDoc.docs[0].data();

      return {
        success: true,
        data: {
          settings: settings.data,
          emergencyContacts: contacts.data,
          userProfile: userData ? {
            username: userData.username,
            boatNumber: userData.boatNumber,
            lastLogin: userData.lastLogin,
            isActive: userData.isActive
          } : null
        }
      };
    } catch (error) {
      throw new Error(`Failed to get user preferences summary: ${error.message}`);
    }
  }

  // Reset user settings to default
  async resetUserSettings(boatNumber) {
    try {
      const defaultSettings = {
        language: 'tamil',
        alertVolume: 80,
        notifications: true,
        autoLocation: true,
        loraEnabled: true,
        emergencyAutoAlert: true,
        theme: 'light',
        autoSync: true,
        dataUsage: 'normal',
        batteryOptimization: true,
        resetAt: new Date()
      };

      await db.collection('settings').doc(boatNumber).set(defaultSettings);

      return {
        success: true,
        message: 'Settings reset to default successfully',
        data: defaultSettings
      };
    } catch (error) {
      throw new Error(`Failed to reset settings: ${error.message}`);
    }
  }

  // Export user data
  async exportUserData(boatNumber) {
    try {
      const [settings, contacts, locationHistory, chatHistory] = await Promise.all([
        this.getUserSettings(boatNumber),
        this.getEmergencyContacts(boatNumber),
        this.getLocationHistory(boatNumber),
        this.getChatHistory(boatNumber)
      ]);

      const exportData = {
        boatNumber,
        exportedAt: new Date(),
        settings: settings.data,
        emergencyContacts: contacts.data,
        locationHistory: locationHistory.data,
        chatHistory: chatHistory.data
      };

      return {
        success: true,
        data: exportData
      };
    } catch (error) {
      throw new Error(`Failed to export user data: ${error.message}`);
    }
  }

  // Get location history for export
  async getLocationHistory(boatNumber, limit = 100) {
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
      return {
        success: true,
        data: []
      };
    }
  }

  // Get chat history for export
  async getChatHistory(boatNumber, limit = 100) {
    try {
      const chatsSnapshot = await db.collection('chats').get();
      const allMessages = [];

      for (const doc of chatsSnapshot.docs) {
        const chatId = doc.id;
        const [boat1, boat2] = chatId.split('_');
        
        if (boat1 === boatNumber || boat2 === boatNumber) {
          const messagesSnapshot = await db.collection('chats')
            .doc(chatId)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

          const messages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            chatId,
            ...doc.data()
          }));

          allMessages.push(...messages);
        }
      }

      // Sort by timestamp
      allMessages.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());

      return {
        success: true,
        data: allMessages.slice(0, limit)
      };
    } catch (error) {
      return {
        success: true,
        data: []
      };
    }
  }

  // Get system statistics
  async getSystemStatistics() {
    try {
      const [usersSnapshot, settingsSnapshot, contactsSnapshot] = await Promise.all([
        db.collection('users').get(),
        db.collection('settings').get(),
        db.collection('emergencyContacts').get()
      ]);

      const stats = {
        totalUsers: usersSnapshot.size,
        activeUsers: usersSnapshot.docs.filter(doc => doc.data().isActive).length,
        totalSettings: settingsSnapshot.size,
        totalEmergencyContacts: contactsSnapshot.size,
        lastUpdated: new Date()
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new Error(`Failed to get system statistics: ${error.message}`);
    }
  }
}

module.exports = new SettingsService(); 