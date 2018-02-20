const passport = require('passport'),
      PassportJWT = require('passport-jwt'),
      jwt = require('jsonwebtoken'),
      config = require('./configure').getConfig(),
      User = require('./models/User'),
      RefreshToken = require('./models/RefreshToken');

const { Strategy, ExtractJwt } = PassportJWT;

const auth = {
  init: () => {
    const opts = {};

    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = config.secret;
    opts.issuer = config.issuer;
    opts.audience = config.audience;
    passport.use(new Strategy(opts, (payload, done) => {
      User.findOne({ _id: payload.id })
        .select([ 'email', 'role', 'roles', 'id' ])
        .exec((err, user) => {
          if (err) {
            return done(err, null);
          }
          return done(null, user);
        });
    }));
  },

  authenticate: () => {
    return passport.authenticate('jwt', { session: false });
  },

  encode: (payload, expiresIn = 3600) => {
    if(!config.secret) {
      throw new Error('secret is empty');
    }
    return jwt.sign(payload, config.secret, {
      issuer: config.issuer,
      audience: config.audience,
      expiresIn,
    });
  },

  getRefreshToken: (userId) => {
    const token = new RefreshToken({
      userId,
      token: auth.encode({ userId }, 36000)
    });

    return token.save()
      .then(() => {
        return token.token;
      });
  },

  validateRefreshToken: (token) => {
    return new Promise((resolve, reject) => {
      const opts = {};

      opts.issuer = config.issuer;
      opts.audience = config.audience;

      jwt.verify(token, config.secret, opts, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve(RefreshToken.findOne({ token: token }));
      });
    });
  },
  
  deleteRefreshToken: (_id) => {
    return new Promise((resolve) => {
      RefreshToken.deleteOne({ _id }, resolve);
    });
  },

  deleteAllRefreshTokens: (userId) => {
    return RefreshToken.deleteMany({
      userId,
    });
  }

};

module.exports = auth;
