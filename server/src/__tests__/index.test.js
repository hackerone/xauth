const app = require('./app.mock');
const request = require('supertest');
const assert = require('assert');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const {INVALID_EMAIL_PASSWORD, INVALID_PASSWORD} = require('../messages');

const createAuthRequest =  (url, email, password) => {
  return request(app)
    .post(url)
    .send({user: {email, password }})
    .set('accept', 'json');
};

const auth = async (url, email, password) => {
  return createAuthRequest(url, email, password)
    .expect(200)
    .then((resp) => {
      assert(resp.body.token != 'null');
    });
}


describe('xauth test', () => {
  before(() => {
    return Promise.all([
      User.remove({}),
      RefreshToken.remove({})
    ]);
  });

  it('should register user', async () => {
    return auth('/auth/register', 'hello1@gmail.com', 'password');
  });

  it('should login with existing user', async () => {
    await auth('/auth/register', 'hello2@gmail.com', 'password');
    return auth('/auth/login', 'hello2@gmail.com', 'password');
  });

  it('should return 400 for invalid username / password', async () => {
    return createAuthRequest('/auth/login', 'hello-invalid@gmail.com', 'password')
      .expect(400)
      .then(resp => {
        assert(resp.body.message.type === 'error');
        assert(resp.body.message.text === INVALID_EMAIL_PASSWORD);
      });
  });

  it('should not allow login with empty email or password', async () => {
    return createAuthRequest('/auth/login', 'hello-invalid', '')
      .expect(400)
      .then(resp => {
        assert(resp.body.message.type === 'error');
        assert(resp.body.message.text === INVALID_EMAIL_PASSWORD);
      });
  });

  it('should not register empty email or password', async () => {
    return createAuthRequest('/auth/register', 'hello-invalid@gmail.com', '')
      .expect(400)
      .then(resp => {
        console.log(JSON.stringify(resp.body.errors));
        assert.equal(resp.body.message.type, 'error');
        assert.equal(resp.body.errors.password, INVALID_PASSWORD);
      });
  });
});