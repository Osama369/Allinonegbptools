const mongoose = require('mongoose');
const { Schema } = mongoose;

const BusinessSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String },
  address: { type: String },
  phone: { type: String },
  website: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  description: { type: String }
}, { _id: false });

const CitationJobSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  business: { type: BusinessSchema, required: true },
  status: { type: String, enum: ['Pending','InProgress','Completed','Failed'], default: 'Pending' },
  citations: [{ type: Schema.Types.ObjectId, ref: 'Citation' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CitationJob', CitationJobSchema);
