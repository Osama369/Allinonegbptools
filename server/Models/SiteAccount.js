const mongoose = require('mongoose');
const { Schema } = mongoose;

const SiteAccountSchema = new Schema({
  siteKey: { type: String, required: true },
  accountEmail: { type: String },
  encryptedCredentials: { type: String },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SiteAccount', SiteAccountSchema);
