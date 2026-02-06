const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  startupName: { type: String, required: true },
  startupOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'Entrepreneur', required: true },
  isNegotiationAllowed: { type: Boolean, default: false },
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  equity: { type: Number, required: true }, // percentage
  status: { type: String, enum: ['Open', 'Closed', 'Cancelled'], default: 'Open' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Entrepreneur', required: true },
  investors: [{
    investor: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' },
    amount: { type: Number },
    investedAt: { type: Date, default: Date.now }
  }],
  amountRaised: { type: Number, default: 0 },
  targetAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to update targetAmount and check if closed
dealSchema.pre('save', function(next) {
  this.targetAmount = this.maxAmount; // Assuming maxAmount is the target
  if (this.amountRaised >= this.targetAmount) {
    this.status = 'Closed';
  }
  this.updatedAt = Date.now();
  next;
});

module.exports = mongoose.model('Deal', dealSchema);
