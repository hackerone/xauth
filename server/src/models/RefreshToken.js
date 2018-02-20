const mongoose = require('mongoose'),
      config = require('../configure').getConfig();

const refreshTokenSchema = new mongoose.Schema({
  userId: { type: String },
  token: { type: String },
  expiry: {
    type: Date,
    default: Date.now() + config.refreshTokenExpiryTime,
  }
});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
