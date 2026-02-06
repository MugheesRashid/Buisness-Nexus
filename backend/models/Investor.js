const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'investor' },
  avatarUrl: { type: String },
  bio: { type: String },
  investmentInterests: {
    type: [String],
    validate: {
      validator: function(arr) {
        return arr.length === new Set(arr).size;
      },
      message: 'investmentInterests must contain unique values'
    }
  },
  investmentStage: {
    type: [String],
    validate: {
      validator: function(arr) {
        return arr.length === new Set(arr).size;
      },
      message: 'investmentStage must contain unique values'
    }
  },
  industries: {
    type: [String],
    validate: {
      validator: function(arr) {
        return arr.length === new Set(arr).size;
      },
      message: 'industries must contain unique values'
    }
  },
  portfolioCompanies: [{ type: String }],
  totalInvestments: { type: Number },
  minimumInvestment: { type: String },
  maximumInvestment: { type: String },
  isOnline: { type: Boolean, default: false },
  investmentHistory: [{
    company: { type: String },
    amount: { type: Number },
    date: { type: Date }
  }],
  investmentFocus: { type: String },
  ticketSize: { type: String },
  portfolioLinks: [{ type: String }],
  socketId: { type: String },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Investor', investorSchema);
