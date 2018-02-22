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
      TOKEN,
      TOKEN_EXPIRY,
      REFRESH_TOKEN,
    };
    this.storage = storage;
    this.profile = {};
  }

  get token() {
    return this.storage.getItem(this.config.TOKEN);
  }

  get refreshToken() {
    return this.storage.getItem(this.config.REFRESH_TOKEN);
  }

  get tokenExpiry() {
    return this.storage.getItem(this.config.TOKEN_EXPIRY);
  }

  set token(token) {
    return this.storage.setItem(this.config.TOKEN, token);
  }

  set refreshToken(refreshToken) {
    return this.storage.setItem(this.config.REFRESH_TOKEN, refreshToken);
  }

  set tokenExpiry(tokenExpiry) {
    return this.storage.setItem(this.config.TOKEN_EXPIRY, tokenExpiry);
  }

  authRequest(url, email, password) {
    return http.post(url)
      .set('accept', 'json')
      .send({user: {email, password}})
      .then(({body}) => {
        this.token = body.token;
        this.refreshToken = body.refreshToken;
        this.tokenExpiry = Date.now() + body.expiresIn;
        if(body.user) {
          this.profile = body.user;
        }
        return body;
      });
  }

  login(email, password) {
    const {authBaseUrl} = this.config;
    return this.authRequest(`${authBaseUrl}/login`, email, password);
  }

  register(email, password) {
    const {authBaseUrl} = this.config;
    return this.authRequest(`${authBaseUrl}/register`, email, password);
  }

  logout() {

  }

  auth(request) {
    console.log(this.token);
    request.set('Authorization', `Bearer ${this.token}`);
    request.set('accept', 'json');
    return request;
  }

  checkToken() {
    return Promise.resolve();
  }

  request(auth = true) {
    if(!auth) {
      return http.agent();
    }

    console.log(this.token);
    return this.checkToken()
      .then(() => {
        return http.agent()
          .use((request) => {
            return this.auth(request);
          })
      });
  }
}

export default RestClient;