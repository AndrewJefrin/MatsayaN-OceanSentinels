const { db } = require('../config/firebase');
const { chatMessageSchema } = require('../utils/validation');
const { v4: uuidv4 } = require('uuid');

class ChatService {
  constructor() {
    this.activeConnections = new Map();
  }

  // Send message between boats
  async sendMessage(messageData) {
    try {
      // Validate message data
      const { error, value } = chatMessageSchema.validate(messageData);
      if (error) {
        throw new Error(`Message validation error: ${error.details[0].message}`);
      }

      const message = {
        id: uuidv4(),
        ...value,
        timestamp: new Date(),
        isDelivered: false,
        isRead: false
      };

      // Store message in Firestore
      const chatId = this.generateChatId(value.fromBoat, value.toBoat);
      await db.collection('chats').doc(chatId).collection('messages').add(message);

      // Store in backup for offline boats
      await this.storeMessageBackup(value.toBoat, message);

      // Try to send via LoRa (simulated)
      const loraResult = await this.sendViaLoRa(message);
      if (loraResult.success) {
        message.isDelivered = true;
        message.deliveredAt = new Date();
        
        // Update message status
        await db.collection('chats').doc(chatId).collection('messages')
          .doc(message.id).update({
            isDelivered: true,
            deliveredAt: new Date()
          });
      }

      return {
        success: true,
        message: 'Message sent successfully',
        data: {
          messageId: message.id,
          isDelivered: message.isDelivered,
          loraStatus: loraResult.status
        }
      };
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // Generate chat ID for two boats
  generateChatId(boat1, boat2) {
    // Sort boat numbers to ensure consistent chat ID
    const sortedBoats = [boat1, boat2].sort();
    return `${sortedBoats[0]}_${sortedBoats[1]}`;
  }

  // Send message via LoRa (simulated)
  async sendViaLoRa(message) {
    try {
      // Simulate LoRa transmission
      // In production, integrate with actual LoRa hardware
      const transmissionDelay = Math.random() * 2000 + 500; // 0.5-2.5 seconds
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const success = Math.random() > 0.1; // 90% success rate
          resolve({
            success,
            status: success ? 'transmitted' : 'failed',
            delay: transmissionDelay
          });
        }, transmissionDelay);
      });
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message
      };
    }
  }

  // Store message backup for offline boats
  async storeMessageBackup(boatNumber, message) {
    try {
      await db.collection('chatBackup').doc(boatNumber).collection('messages').add({
        ...message,
        backupCreatedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to store message backup:', error);
    }
  }

  // Get chat messages between two boats
  async getChatMessages(boat1, boat2, limit = 50) {
    try {
      const chatId = this.generateChatId(boat1, boat2);
      
      const messagesSnapshot = await db.collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: messages.reverse() // Return in chronological order
      };
    } catch (error) {
      throw new Error(`Failed to get chat messages: ${error.message}`);
    }
  }

  // Get all chats for a boat
  async getBoatChats(boatNumber) {
    try {
      // Get all chat documents where the boat is involved
      const chatsSnapshot = await db.collection('chats').get();
      
      const chats = [];
      
      for (const doc of chatsSnapshot.docs) {
        const chatId = doc.id;
        const [boat1, boat2] = chatId.split('_');
        
        if (boat1 === boatNumber || boat2 === boatNumber) {
          const otherBoat = boat1 === boatNumber ? boat2 : boat1;
          
          // Get last message
          const lastMessageSnapshot = await db.collection('chats')
            .doc(chatId)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

          let lastMessage = null;
          if (!lastMessageSnapshot.empty) {
            lastMessage = {
              id: lastMessageSnapshot.docs[0].id,
              ...lastMessageSnapshot.docs[0].data()
            };
          }

          chats.push({
            chatId,
            otherBoat,
            lastMessage,
            unreadCount: await this.getUnreadCount(chatId, boatNumber)
          });
        }
      }

      // Sort by last message timestamp
      chats.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return b.lastMessage.timestamp.toDate() - a.lastMessage.timestamp.toDate();
      });

      return {
        success: true,
        data: chats
      };
    } catch (error) {
      throw new Error(`Failed to get boat chats: ${error.message}`);
    }
  }

  // Get unread message count for a chat
  async getUnreadCount(chatId, boatNumber) {
    try {
      const unreadSnapshot = await db.collection('chats')
        .doc(chatId)
        .collection('messages')
        .where('toBoat', '==', boatNumber)
        .where('isRead', '==', false)
        .get();

      return unreadSnapshot.size;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId, boatNumber) {
    try {
      const unreadMessages = await db.collection('chats')
        .doc(chatId)
        .collection('messages')
        .where('toBoat', '==', boatNumber)
        .where('isRead', '==', false)
        .get();

      const updatePromises = unreadMessages.docs.map(doc => 
        doc.ref.update({
          isRead: true,
          readAt: new Date()
        })
      );

      await Promise.all(updatePromises);

      return {
        success: true,
        message: 'Messages marked as read',
        count: unreadMessages.size
      };
    } catch (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }

  // Send SOS message
  async sendSOSMessage(boatNumber, location, message = '') {
    try {
      const sosMessage = {
        id: uuidv4(),
        fromBoat: boatNumber,
        toBoat: 'ALL', // Broadcast to all boats
        message: `SOS: ${message}`.trim(),
        messageType: 'sos',
        location,
        timestamp: new Date(),
        isDelivered: false,
        isRead: false,
        isSOS: true
      };

      // Send to all active boats
      const usersSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .get();

      const sendPromises = usersSnapshot.docs.map(async (doc) => {
        const userData = doc.data();
        if (userData.boatNumber !== boatNumber) {
          const sosCopy = { ...sosMessage, toBoat: userData.boatNumber };
          await this.sendMessage(sosCopy);
        }
      });

      await Promise.all(sendPromises);

      return {
        success: true,
        message: 'SOS message sent to all boats',
        data: {
          messageId: sosMessage.id,
          sentTo: usersSnapshot.size - 1 // Exclude sender
        }
      };
    } catch (error) {
      throw new Error(`Failed to send SOS message: ${error.message}`);
    }
  }

  // Get backup messages for a boat (when coming back online)
  async getBackupMessages(boatNumber) {
    try {
      const backupSnapshot = await db.collection('chatBackup')
        .doc(boatNumber)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();

      const messages = backupSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: messages
      };
    } catch (error) {
      throw new Error(`Failed to get backup messages: ${error.message}`);
    }
  }

  // Clear backup messages after successful sync
  async clearBackupMessages(boatNumber) {
    try {
      const backupSnapshot = await db.collection('chatBackup')
        .doc(boatNumber)
        .collection('messages')
        .get();

      const deletePromises = backupSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);

      return {
        success: true,
        message: 'Backup messages cleared',
        count: backupSnapshot.size
      };
    } catch (error) {
      throw new Error(`Failed to clear backup messages: ${error.message}`);
    }
  }

  // Get LoRa connection status
  async getLoRaStatus(boatNumber) {
    try {
      // Simulate LoRa status check
      // In production, integrate with actual LoRa hardware
      const status = {
        isConnected: Math.random() > 0.2, // 80% connection rate
        signalStrength: Math.floor(Math.random() * 100),
        lastSeen: new Date(),
        nearbyNodes: Math.floor(Math.random() * 10),
        batteryLevel: Math.floor(Math.random() * 100)
      };

      // Store status in Firestore
      await db.collection('loraStatus').doc(boatNumber).set({
        ...status,
        updatedAt: new Date()
      });

      return {
        success: true,
        data: status
      };
    } catch (error) {
      throw new Error(`Failed to get LoRa status: ${error.message}`);
    }
  }

  // Broadcast message to all boats
  async broadcastMessage(fromBoat, message, messageType = 'text') {
    try {
      const usersSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .get();

      const broadcastPromises = usersSnapshot.docs.map(async (doc) => {
        const userData = doc.data();
        if (userData.boatNumber !== fromBoat) {
          await this.sendMessage({
            fromBoat,
            toBoat: userData.boatNumber,
            message,
            messageType
          });
        }
      });

      await Promise.all(broadcastPromises);

      return {
        success: true,
        message: 'Broadcast message sent',
        sentTo: usersSnapshot.size - 1 // Exclude sender
      };
    } catch (error) {
      throw new Error(`Failed to broadcast message: ${error.message}`);
    }
  }

  // Get chat statistics
  async getChatStatistics(boatNumber) {
    try {
      const chatsSnapshot = await db.collection('chats').get();
      
      let totalMessages = 0;
      let unreadMessages = 0;
      let activeChats = 0;

      for (const doc of chatsSnapshot.docs) {
        const chatId = doc.id;
        const [boat1, boat2] = chatId.split('_');
        
        if (boat1 === boatNumber || boat2 === boatNumber) {
          const messagesSnapshot = await db.collection('chats')
            .doc(chatId)
            .collection('messages')
            .get();

          totalMessages += messagesSnapshot.size;

          const unreadSnapshot = await db.collection('chats')
            .doc(chatId)
            .collection('messages')
            .where('toBoat', '==', boatNumber)
            .where('isRead', '==', false)
            .get();

          unreadMessages += unreadSnapshot.size;

          // Check if chat is active (has messages in last 24 hours)
          const recentMessages = await db.collection('chats')
            .doc(chatId)
            .collection('messages')
            .where('timestamp', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
            .get();

          if (recentMessages.size > 0) {
            activeChats++;
          }
        }
      }

      return {
        success: true,
        data: {
          totalMessages,
          unreadMessages,
          activeChats,
          totalChats: chatsSnapshot.docs.filter(doc => {
            const [boat1, boat2] = doc.id.split('_');
            return boat1 === boatNumber || boat2 === boatNumber;
          }).length
        }
      };
    } catch (error) {
      throw new Error(`Failed to get chat statistics: ${error.message}`);
    }
  }
}

module.exports = new ChatService(); 