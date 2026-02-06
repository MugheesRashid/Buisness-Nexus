const express = require('express');
const Message = require('../models/Message');
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteConversation
} = require('../services/messagesService');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all conversations for the authenticated user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await getConversations(req.user.id);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages between two users
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await getMessages(req.user.id, req.params.userId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const conversation = await sendMessage(req.user.id, receiverId, content);
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark messages as read
router.put('/read/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await markAsRead(req.user.id, req.params.conversationId);
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get total unread message count for the authenticated user
router.get('/unread-count', auth, async (req, res) => {
  try {
    const conversations = await Message.find({
      participants: req.user.id,
    });

    let totalUnread = 0;
    conversations.forEach((conv) => {
      // unreadCount is an object, so we access it directly
      const userUnreadCount = conv.unreadCount[req.user.id.toString()] || 0;
      totalUnread += userUnreadCount;
    });

    res.json({ totalUnread });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a conversation
router.delete('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const result = await deleteConversation(req.params.conversationId, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
