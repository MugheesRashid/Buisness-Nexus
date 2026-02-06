const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },

  // Organizer
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  organizerType: {
    type: String,
    enum: ["Entrepreneur", "Investor"],
    required: true
  },
  organizerEmail: {
    type: String,
    required: true
  },

  // Recipient (the other person in the 1:1 meeting)
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  recipientType: {
    type: String,
    enum: ["Entrepreneur", "Investor"],
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },

  // Meeting details
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled"],
    default: "pending"
  },

  meetingType: {
    type: String,
    enum: ["online", "offline"],
    default: "online"
  },

  meetingLink: String,
  location: String,

  createdAt: { type: Date, default: Date.now }
});

// Add validation for time
meetingSchema.pre('save', function(next) {
  if (this.startTime >= this.endTime) {
    next(new Error('End time must be after start time'));
  }
  next;
});

module.exports = mongoose.model('Meeting', meetingSchema);