const configure = require('./configure'),
      db = require('./models/db');

class XAuth {
  get auth() { 
    return require('./auth');
  }
  
  get route() {
    return require('./route')
  }
  
  constructor(config, mongoose) {
    if(mongoose) {
      db.mongoose = mongoose;
    }
    configure.setConfig(config);
    this.auth.init();
  }
}

module.exports = XAuth;