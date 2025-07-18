const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const { authenticateToken, requireBoatOwner } = require('../middleware/auth');

// Send message between boats
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const messageData = {
      ...req.body,
      fromBoat: req.user.boatNumber
    };
    const result = await chatService.sendMessage(messageData);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get chat messages between two boats
router.get('/:boat1/:boat2', authenticateToken, async (req, res) => {
  try {
    const { boat1, boat2 } = req.params;
    const { limit = 50 } = req.query;
    
    // Ensure user can access this chat
    if (req.user.boatNumber !== boat1 && req.user.boatNumber !== boat2) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat'
      });
    }

    const result = await chatService.getChatMessages(boat1, boat2, parseInt(limit));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all chats for a boat
router.get('/:boatNumber/chats', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await chatService.getBoatChats(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark messages as read
router.post('/:chatId/read', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const [boat1, boat2] = chatId.split('_');
    
    // Ensure user can access this chat
    if (req.user.boatNumber !== boat1 && req.user.boatNumber !== boat2) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat'
      });
    }

    const result = await chatService.markMessagesAsRead(chatId, req.user.boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Send SOS message
router.post('/sos', authenticateToken, async (req, res) => {
  try {
    const { location, message } = req.body;
    const result = await chatService.sendSOSMessage(req.user.boatNumber, location, message);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Broadcast message to all boats
router.post('/broadcast', authenticateToken, async (req, res) => {
  try {
    const { message, messageType = 'text' } = req.body;
    const result = await chatService.broadcastMessage(req.user.boatNumber, message, messageType);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get LoRa status
router.get('/:boatNumber/lora-status', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await chatService.getLoRaStatus(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get backup messages (when coming back online)
router.get('/:boatNumber/backup', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await chatService.getBackupMessages(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Clear backup messages after successful sync
router.delete('/:boatNumber/backup', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await chatService.clearBackupMessages(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get chat statistics
router.get('/:boatNumber/stats', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const result = await chatService.getChatStatistics(boatNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get unread message count for all chats
router.get('/:boatNumber/unread-count', authenticateToken, requireBoatOwner, async (req, res) => {
  try {
    const { boatNumber } = req.params;
    const chats = await chatService.getBoatChats(boatNumber);
    
    const totalUnread = chats.data.reduce((sum, chat) => sum + chat.unreadCount, 0);
    
    res.status(200).json({
      success: true,
      data: {
        totalUnread,
        chatsWithUnread: chats.data.filter(chat => chat.unreadCount > 0).length,
        totalChats: chats.data.length
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