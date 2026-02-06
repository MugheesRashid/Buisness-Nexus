const mongoose = require('mongoose');

const videoCallSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  callerType: {
    type: String,
    enum: ["entrepreneur", "investor"],
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  receiverType: {
    type: String,
    enum: ["entrepreneur", "investor"],
    required: true
  },
  status: {
    type: String,
    enum: ["ringing", "calling", "accepted", "rejected", "ended", "missed"],
    default: "ringing"
  },
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('VideoCall', videoCallSchema);
