const mongoose = require('./db').mongoose,
      passwordHash = require('password-hash'),
      {EMAIL_ALREADY_EXISTS, INVALID_PASSWORD, INVALID_EMAIL, PASSWORD_TOO_SMALL} = require('../messages'),
      config = require('../configure').getConfig(),
      get = require('get-value');
      
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
          if(count === 0) {
            return true;
          }
          
          if (this.socialLoginType === 'email') {
            this.invalidate('email', 'Email already exists.');
          } else {
            this.invalidate('email', 'This email is registered with a different social account.');
          }
          return count === 0;
        });
      },
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
  invite: { type: mongoose.Schema.Types.ObjectId },
  blocked: { type: Boolean, default: false},
  invalidAttemptCount: { type: Number, default: 0 },
});

user.methods.setPassword = function(password) {
  if(!password || password.length < 8) {
    return false;
  }
  this.password = passwordHash.generate(password);
  return true;
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
  if (this.invalidAttemptCount === 0 && this.blocked === false) {
    return;
  }
  this.blocked = false;
  this.invalidAttemptCount = 0;
  return this.save();
}

user.methods.block = function() {
  this.blocked = true;
  return this.save();
}

const formatImageUrl = (url) => {
  if(!url) {
    return url;
  }

  if(url.endsWith('sz=50')) {
    return url.substr(0, url.length - 5);
  }

  return url;
}

user.methods.getImage = function() {
  if(!this.socialLoginProfile) {
    return;
  }

  return formatImageUrl(get(this, 'socialLoginProfile.photos.0.value'));
}

user.methods.getJSONFor = function(accessUser) {
  return {
    id: this.id,
    email: this.email,
    joinDate: this.joinDate,
    role: this.role,
    status: this.status
  };
}

user.methods.allowedRoles = function() {
  const roles = {
    'user': ['user'],
    'manager': ['user', 'manager'],
    'admin': ['user', 'manager', 'admin']
  };
  return roles[this.role];
}

user.methods.setRole = function(role, accessUser) {
  if(accessUser.allowedRoles().includes(role)) {
    this.role = role;
    return true;
  }
  return false;
}

const createUser = async (data) => {
  const user = new User(data);
  await user.save();
  return user;
}

user.statics.findOrCreate = async (socialLoginType, profile, invite = null) => {
  const user = await User.findOne({socialLoginType, socialLoginId: profile.id}).exec();

  if(user) {
    return user;
  }
  
  return createUser({
    email: get(profile, 'emails.0.value'),
    socialLoginProfile: profile,
    socialLoginId: profile.id,
    socialLoginType,
    invite
  });
}

const User = mongoose.model('User', user);

module.exports = User;