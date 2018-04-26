const passport = require('passport'),
      PassportJWT = require('passport-jwt'),
      jwt = require('jsonwebtoken'),
      config = require('./configure').getConfig(),
      User = require('./models/User'),
      RefreshToken = require('./models/RefreshToken'),
      GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
      FacebookStrategy = require('passport-facebook').Strategy;

const { Strategy, ExtractJwt } = PassportJWT;

const {url} = config;

const {GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_SCOPE} = config.googleAuth || {};

const {FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, FACEBOOK_PROFILE_FIELDS, FACEBOOK_SCOPE} = config.facebookAuth || {};

if(GOOGLE_SCOPE.indexOf('email') < 0) {
  GOOGLE_SCOPE.push('email');
}

const auth = {
  init: () => {
    const opts = {};

    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = config.secret;
    opts.issuer = config.issuer;
    opts.audience = config.audience;
    passport.use(new Strategy(opts, (payload, done) => {
      User.findOne({ _id: payload.id, blocked: false })
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
        scope: GOOGLE_SCOPE,
        passReqToCallback: true
      }, async (req, accessToken, refreshToken, profile, done) => {
        try {
          const query = req.query || {};
          const user = await User.findOrCreate('google', profile, query.invite);
          return done(null, user);
        } catch(err) {
          done(err, null);
        }
      }));
    }

    if(FACEBOOK_CLIENT_ID) {
      passport.use(new FacebookStrategy({
        clientID: FACEBOOK_CLIENT_ID,
        clientSecret: FACEBOOK_CLIENT_SECRET,
        callbackURL: `${url}/auth/facebook/callback`,
        profileFields: FACEBOOK_PROFILE_FIELDS,
        scope: FACEBOOK_SCOPE,
        passReqToCallback: true
      }, async (req, accessToken, refreshToken, profile, done) => {
        try {
          const query = req.query || {};
          const user = await User.findOrCreate('facebook', profile, query.invite);
          return done(null, user);
        } catch(err) {
          done(err, null);
        }
      }));
    }

    return passport.initialize();
  },

  getUser: (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', {}, (err, user, info) => {
        if(err) {
          return reject(err);
        }
        return resolve(user);
      })(req, res, next);
    });
  },

  authenticate: () => {
    return passport.authenticate('jwt', {session: false});
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
