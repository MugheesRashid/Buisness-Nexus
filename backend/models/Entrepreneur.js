const mongoose = require('mongoose');

const entrepreneurSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'entrepreneur' },
  avatarUrl: { type: String },
  bio: { type: String },
  startupName: { type: String },
  tagline: { type: String },
  summary: { type: String },
  pitch: { type: String },
  stage: { type: String },
  fundingNeeded: { type: String },
  industry: {
    type: [String],
    validate: {
      validator: function(arr) {
        return arr.length === new Set(arr).size;
      },
      message: 'industry must contain unique values'
    }
  },
  location: { type: String },
  startupSummary: {type: String},
  foundedYear: { type: String },
  teamSize: { type: String },
  website: { type: String },
  pitchDeckUrl: { type: String },
  logo: { type: String },
  socialLinks: [{ type: String }],
  isOnline: { type: Boolean, default: false },
  socketId: { type: String },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  profileComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to check profile completeness
entrepreneurSchema.pre('save', function(next) {
  this.profileComplete = !!(this.startupName && this.summary && this.pitch);
  next;
});

module.exports = mongoose.model('Entrepreneur', entrepreneurSchema);
