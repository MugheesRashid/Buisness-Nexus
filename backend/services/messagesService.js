const Message = require("../models/Message");
const Entrepreneur = require("../models/Entrepreneur");
const Investor = require("../models/Investor");

// Get all conversations for a user
const getConversations = async (userId) => {
  try {
    const conversations = await Message.find({
      participants: userId,
    }).sort({ updatedAt: -1 });

    // Populate participant details
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.participants.find(
          (p) => p.toString() !== userId.toString(),
        );
        let otherParticipant = await Entrepreneur.findById(otherParticipantId);
        if (!otherParticipant) {
          otherParticipant = await Investor.findById(otherParticipantId);
        }

        return {
          ...conv.toObject(),
          otherParticipant: {
            _id: otherParticipant._id,
            name: otherParticipant.name,
            email: otherParticipant.email,
            role: otherParticipant.role,
          },
        };
      }),
    );

    return populatedConversations;
  } catch (error) {
    throw new Error("Error fetching conversations: " + error.message);
  }
};

// Get messages between two users
const getMessages = async (userId1, userId2) => {
  try {
    const conversation = await Message.findOne({
      participants: { $all: [userId1, userId2] },
    });

    if (!conversation) {
      return [];
    }

    // Return all messages in the conversation, mapping createdAt to timestamp for frontend compatibility
    return conversation.messages.map((msg) => ({
      _id: msg._id,
      content: msg.content,
      senderId: msg.senderId,
      timestamp: msg.createdAt,
    }));
  } catch (error) {
    throw new Error("Error fetching messages: " + error.message);
  }
};

// Send a message
const sendMessage = async (senderId, receiverId, content) => {
  try {
    let conversation = await Message.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    const newMessage = {
      content,
      senderId,
      createdAt: new Date(),
      readBy: [senderId], // Sender has read their own message
    };

    if (conversation) {
      // Update existing conversation
      console.log("Updating existing conversation");
      conversation.messages.push(newMessage);
      conversation.lastMessage = {
        content,
        senderId,
        createdAt: new Date(),
      };
      conversation.updatedAt = new Date();

      // Update unread count for receiver
      const currentUnread = conversation.unreadCount[receiverId.toString()] || 0;
      conversation.unreadCount[receiverId.toString()] = currentUnread + 1;

      await conversation.save();
    } else {
      // Create new conversation
      console.log("Creating new conversation");
      conversation = new Message({
        participants: [senderId, receiverId],
        messages: [newMessage],
        lastMessage: {
          content,
          senderId,
          createdAt: new Date(),
        },
        unreadCount: { [receiverId.toString()]: 1 },
      });
      console.log(conversation);
      await conversation.save();
    }

    return conversation;
  } catch (error) {
    throw new Error("Error sending message: " + error.message);
  }
};

// Mark messages as read
const markAsRead = async (userId, conversationId) => {
  try {
    const conversation = await Message.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Mark all unread messages as read by this user
    conversation.messages.forEach((message) => {
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }
    });

    conversation.unreadCount[userId.toString()] = 0;
    await conversation.save();

    return conversation;
  } catch (error) {
    throw new Error("Error marking messages as read: " + error.message);
  }
};

// Delete a conversation
const deleteConversation = async (conversationId, userId) => {
  try {
    const conversation = await Message.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if user is a participant
    if (!conversation.participants.includes(userId)) {
      throw new Error("Unauthorized to delete this conversation");
    }

    await Message.findByIdAndDelete(conversationId);
    return { message: "Conversation deleted successfully" };
  } catch (error) {
    throw new Error("Error deleting conversation: " + error.message);
  }
};

const setOnlineStatus = async (userId, userRole, isOnline) => {
  try {
    console.log("Set online", userId, userRole, isOnline);
    if (userRole === "entrepreneur") {
      console.log("Entrepreneur");
       await Entrepreneur.findByIdAndUpdate(
        userId,
        { isOnline },
        { new: true },
      );
    } else if (userRole === "investor") {
       await Investor.findByIdAndUpdate(
        userId,
        { isOnline },
        { new: true },
      );
    } else {
      throw new Error("Invalid user role");
    }
  } catch (err) {
    console.log("Set online");
    throw new Error("Error setting online status: " + err.message);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteConversation,
  setOnlineStatus
};
