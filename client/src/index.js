import http from 'superagent';

class RestClient {
  constructor({
    authBaseUrl = '/auth',
    storage = sessionStorage,
    TOKEN = 'token',
    TOKEN_EXPIRY = 'token_expiry',
    REFRESH_TOKEN = 'refresh_token'
  } = {}) {
    this.config = {
      authBaseUrl,
      storage,
      TOKEN,
      TOKEN_EXPIRY,
      REFRESH_TOKEN,
    };
  }

  get token() {
    return this.storage.get(this.config.TOKEN);
  }

  get refreshToken() {
    return this.storage.get(this.config.REFRESH_TOKEN);
  }

  get tokenExpiry() {
    return this.storage.get(this.config.TOKEN_EXPIRY);
  }

  authRequest(url, email, password) {

  }

  login(email, password) {
    const {authBaseUrl} = this.config;
    return this.authRequest(`${authBaseUrl}/login`, email, password);
  }

  register(email, password) {
    const {authBaseUrl} = this.config;
    return this.authRequest(`${authBaseUrl}/login`, email, password);
  }

  logout() {

  }

  auth(request) {
    request.set('Authorization', `Bearer ${this.token}`);
    return request;
  }

  checkToken() {
    return new Promise(resolve => {
      setTimeout(() => resolve(), 2000);
    });
  }

  request(auth = true) {
    if(!auth) {
      return http.agent();
    }

    return this.checkToken()
      .then(() => http.agent().use(this.auth));
  }
}

export default RestClient;