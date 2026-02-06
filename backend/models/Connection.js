const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entrepreneur',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investor',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique connection between sender and receiver
connectionSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Update the updatedAt field before saving
connectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next;
});

module.exports = mongoose.model('Connection', connectionSchema);
