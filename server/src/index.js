const auth = require('./auth'),
      configure = require('./configure'),
      route = require('./route');

module.exports = {
  auth,
  configure,
  route,
  init: (config) => {
    configure.setConfig(config);
    auth.init();
  }
}