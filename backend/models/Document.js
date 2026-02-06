const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true }, // Cloudinary URL
  fileSize: { type: Number, default: 0 }, // File size in bytes
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Can be Investor or Entrepreneur
  version: { type: Number, default: 1 },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },
  signatureImageUrl: { type: String }, // For e-signature
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
