const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, required: true }],
  messages: [{
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    content: { type: String, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now },
    readBy: [{ type: mongoose.Schema.Types.ObjectId }]
  }],
  lastMessage: {
    content: { type: String },
    senderId: { type: mongoose.Schema.Types.ObjectId },
    createdAt: { type: Date }
  },
  unreadCount: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
