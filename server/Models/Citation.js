const mongoose = require('mongoose');
const { Schema } = mongoose;

const CitationSchema = new Schema({
  siteKey: { type: String, required: true },
  siteName: { type: String },
  jobId: { type: Schema.Types.ObjectId, ref: 'CitationJob' },
  score: { type: Number },
  reason: { type: String },
  payload: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['Pending','InProgress','Success','Failed','VerificationNeeded'], default: 'Pending' },
  accountEmail: { type: String },
  listingUrl: { type: String },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Citation', CitationSchema);
