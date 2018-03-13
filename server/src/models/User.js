const mongoose = require('./db').mongoose,
      passwordHash = require('password-hash'),
      {EMAIL_ALREADY_EXISTS, INVALID_PASSWORD, INVALID_EMAIL, PASSWORD_TOO_SMALL} = require('../messages'),
      config = require('../configure').getConfig();
      
const EMAIL_REGEX = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;

const user = new mongoose.Schema({
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
      message: 'Email already exists',
    }
  },
  password: {
    type: String,
    required: [function() {
      if(this.socialLoginType === 'email') {
        return true;
      }
      return false;
    }, INVALID_PASSWORD],
    minlength: [8, 'Password has to be atleast 8 characters long.']
  },
  socialLoginType: {
    type: String,
    default: 'email'
  },
  socialLoginId: {
    type: String,
  },
  socialLoginProfile: {
    type: Object
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    default: config.defaultRole,
  },
  status: { type: String, default: config.defaultStatus },
  blocked: { type: Boolean, default: false},
  invalidAttemptCount: { type: Number, default: 0 },
});

user.methods.setPassword = function(password) {
  if(!password || password.length < 8) {
    return;
  }
  this.password = passwordHash.generate(this.password);
}

user.methods.checkPassword = function(password) {
  return passwordHash.verify(password, this.password);
}

user.methods.recordInvalidAttempt = function() {
  if(!config.invalidAttemptCountThreshold) {
    return;
  }

  this.invalidAttemptCount++;
  if(this.invalidAttemptCount >= config.invalidAttemptCountThreshold) {
    this.blocked = true;
  }
  return this.save();
}

user.methods.unblock = function() {
  this.blocked = false;
  this.invalidAttemptCount = 0;
  return this.save();
}

user.methods.getJSONFor = function(accessUser) {
  return {
    email: this.email,
    joinDate: this.joinDate,
    role: this.role,
    status: this.status
  };
}

user.statics.findOrCreate = async (socialLoginType, profile) => {
  const existingUser = await User.findOne({socialLoginType, socialLoginId: profile.id}).exec();

  if(existingUser) {
    return existingUser;
  }
  
  const newUser = new User({
    email: profile.emails[0].value,
    socialLoginProfile: profile,
    socialLoginId: profile.id,
    socialLoginType,
  });

  await newUser.save();
  return newUser;
}

const User = mongoose.model('User', user);

module.exports = User;