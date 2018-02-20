const _config = {
  secret: '',
  issuer: '',
  audience: '',
  tokenExpiryTime: 3600,
  roles: ['user', 'admin'],
  defaultRole: 'user',
  refreshTokenExpiryTime: 3600000
};

module.exports = {
  getConfig: () => {
    return _config;
  },
  setConfig: (config) => {
    Object.keys(config).forEach(key => {
      _config[key] = config[key];
    });
  }
};
