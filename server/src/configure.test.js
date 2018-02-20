const configure = require('./configure'),
      assert = require('assert');

describe('configuration', () => {
  it('should return default', () => {
    const config = configure.getConfig();
    assert.equal(config.tokenExpiryTime, 3600);
    assert.equal(config.defaultRole, 'user');
  });

  it('should set config', () => {
    configure.setConfig({
      tokenExpiryTime: 7200
    });
    const config = configure.getConfig();
    assert.equal(config.tokenExpiryTime, 7200);
    assert.equal(config.defaultRole, 'user');
  });
});