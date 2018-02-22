const express = require('express'),
      Xauth = require('../index'),
      mongoose = require('mongoose'),
      bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
mongoose.connect('mongodb://localhost/xauth_test');
const xauth = new Xauth({
  secret: 'xxxxx',
  issuer: 'xxxxx',
  audience: 'xxxxx',
}, mongoose);

app.use('/auth', xauth.route);

app.use((err, req, res, next) => {
  if(err.name === 'ValidationError') {
    return res.status(400).json({
      message: {
        type: 'danger',
        text: !err.errors ? err.message : '',
      },
      errors: Object.keys(err.errors || {}).reduce(function(errors, key){
        errors[key] = err.errors[key].message;

        return errors;
      }, {})
    });
  } 
  next(err);
});

module.exports = app;