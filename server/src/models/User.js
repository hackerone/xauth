const mongoose = require('mongoose'),
      passwordHash = require('password-hash'),
      {EMAIL_ALREADY_EXISTS, INVALID_PASSWORD, INVALID_EMAIL} = require('../messages'),
      config = require('../configure').getConfig();
      
const EMAIL_REGEX = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [ true, INVALID_EMAIL ],
    unique: true,
    match: [ EMAIL_REGEX, INVALID_EMAIL ],
    validate: {
      validator: function(email) {
        const cond = { email };

        if (this._id) {
          cond._id = { $ne: this._id };
        }
        return User.count(cond).then((count) => {
          return count === 0;
        });
      },
      message: EMAIL_ALREADY_EXISTS,
    }
  },
  password: {
    type: String,
    required: [ true, INVALID_PASSWORD ],
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    default: 'user',
  },
  status: { type: String, default: 'active' }
});

user.methods.setPassword = function(password) {
  this.password = passwordHash.generate(this.password);
}

user.methods.checkPassword = function(password) {
  return passwordHash.verify(password, this.password);
}

user.methods.getJSONFor = function(accessUser) {
  return {
    email: this.email,
    joinDate: this.joinDate,
    role: this.role
  };
}

const User = mongoose.model('user', userSchema);

module.exports = User;