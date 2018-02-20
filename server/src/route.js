const express = require('express'),
      User = require('./models/User'),
      auth = require('./auth'),
      {ValidationError} = require('./Errors');
const {
  LOGIN_SUCCESS,
  REGISTER_SUCCESS,
  INVALID_EMAIL_PASSWORD,
  INACTIVE_EMAIL,
  INVALID_BODY,
  TOKEN_SUCCESS,
  INVALID_TOKEN,
  LOGOUT_SUCCESS,
  REGISTER_FAIL,
  TYPE_ERROR,
  TYPE_SUCCESS,
  PROFILE_SAVED,
} = require('./messages');

const route = express.Router();

const sendTokens = (id, message, res, user = null) => {
  return auth.getRefreshToken(id)
    .then((refreshToken) => {
      res.json({
        token: auth.encode({ id }),
        expiresIn: 1200,
        refreshToken: refreshToken,
        message: {
          type: TYPE_SUCCESS,
          text: message,
        },
        user,
      });
    });
};

route.post('/register', (req, res, next) => {
  const user = new User(req.body.user);
  user.save((error) => {
    if (error) {
      return next(error);
    } else {
      return sendTokens(user.id, REGISTER_SUCCESS, res, user.getJSONFor(user))
    }
  });
});


route.post('/login', (req, res, next) => {
  const body = req.body.user;

  if (!body || !body.email || !body.password) {
    next(new ValidationError(INVALID_BODY));
  }

  return User.findOne({ email: body.email })
    .exec((err, user) => {
      if (err) {
        return next(err);
      }
      if (!user || !user.checkPassword(body.password)) {
        return next(new Error(INVALID_EMAIL_PASSWORD));
      }

      if (!user.status) {
        return next(new Error(INACTIVE_EMAIL));
      }
      
      return sendTokens(user.id, LOGIN_SUCCESS, res, getProfile(user));
    });
});

route.delete('/logout', auth.authenticate(), (req, res) => {
  auth.deleteAllRefreshTokens(req.user.id);
  res.json({
    message: {
      text: LOGOUT_SUCCESS,
      type: 'success',
    },
  });
});

route.post('/token', (req, res, next) => {
  const { refreshToken } = req.body.user;

  auth.validateRefreshToken(refreshToken)
    .then((token) => {
      if (!token) {
        return next(new Error(INVALID_TOKEN));
      }
      
      return auth.deleteRefreshToken(token._id)
        .then(() => {
          sendTokens(token.userId, TOKEN_SUCCESS, res);
        });

    })
    .catch((err) => {
      next(err);
    });
});

route.get('/profile', auth.authenticate(), (req, res) => {
  res.json({
    user: getProfile(req.user)
  });
});

route.post('/profile', auth.authenticate(), (req, res) => {
  const body = req.body.user;

  if (!body) {
    throw new Error(INVALID_BODY);
  }
  User.findOne({
    _id: req.user._id
  }).then((user) => {
    bulkApplyParams(user, body, [ 'email', 'password' ]);
    return user.save();
  }).then((user) => {
    return res.json({
      id: user.id,
      message: {
        text: PROFILE_SAVED,
        type: TYPE_SUCCESS,
      },
    });
  }).catch((error) => {
    return res.status(400).json({
      errors: formatError(error)
    });
  });
});

module.exports = route;
