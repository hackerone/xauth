const passport = require('passport'),
      PassportJWT = require('passport-jwt'),
      jwt = require('jsonwebtoken'),
      config = require('./configure').getConfig(),
      User = require('./models/User'),
      RefreshToken = require('./models/RefreshToken'),
      GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;;

const { Strategy, ExtractJwt } = PassportJWT;

const {url} = config;

const {GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, scope} = config.googleAuth || {};
if(scope.indexOf('email') < 0) {
  scope.push('email');
}

const auth = {
  init: () => {
    const opts = {};

    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = config.secret;
    opts.issuer = config.issuer;
    opts.audience = config.audience;
    passport.use(new Strategy(opts, (payload, done) => {
      User.findOne({ _id: payload.id })
        .select([ 'email', 'role', 'roles', 'id', 'status', 'joinDate' ])
        .exec((err, user) => {
          if (err) {
            return done(err, null);
          }
          return done(null, user);
        });
    }));

    if(GOOGLE_CLIENT_ID) {
      passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${url}/auth/google/callback`,
        scope
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await User.findOrCreate('google', profile);
          return done(null, user);
        } catch(err) {
          done(err, null);
        }
      }));
    }
    return passport.initialize();
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
