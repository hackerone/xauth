const _config = {
  secret: '',
  issuer: '',
  audience: '',
  invalidAttemptCountThreshold: 3,
  tokenExpiryTime: 3600,
  roles: ['user', 'admin'],
  defaultRole: 'user',
  defaultStatus: 'active',
  refreshTokenExpiryTime: 3600000,
  url: 'http://localhost:2708',
  googleAuth: {
    GOOGLE_CLIENT_ID: null,
    GOOGLE_CLIENT_SECRET: null,
    scope: ['profile']
  }
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
