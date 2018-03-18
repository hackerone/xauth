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

  handleTokenResponse = ({body}) => {
    this.token = body.token;
    this.refreshToken = body.refreshToken;
    this.tokenExpiry = Date.now() + body.expiresIn;
    if(body.user) {
      this.profile = body.user;
    }
    return body;
  }

  authRequest(url, email, password) {
    return new Promise((resolve, reject) => {
      http.post(url)
      .set('accept', 'json')
      .send({user: {email, password}})
      .end((err, res) => {
        if(err) {
          return reject(res.body);
        }
        return resolve(this.handleTokenResponse(res));
      })
    });
  }

  authSocialRequest(url, code) {
    return new Promise((resolve, reject) => {
      http.get(url)
      .query({code})
      .end((err, res) => {
        if(err) {
          return reject(res.body);
        }
        return resolve(this.handleTokenResponse(res));
      });
    });
  }

  reAuth() {
    const {authBaseUrl} = this.config;
    return new Promise((resolve, reject) => {
      this.request(false)
        .post(`${authBaseUrl}/token`)
        .send({user: { refreshToken: this.refreshToken }})
        .end((err, res) => {
          if(err) {
            return reject(res.body);
          }
          return resolve(this.handleTokenResponse(res));
        });
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

  socialLogin(type = 'google', code) {
    return this.authSocialRequest(`${type}/callback`, code);
  }

  logout() {
    this.storage.clear();
    return Promise.resolve();
  }

  auth(request) {
    console.log('using token:',this.token);
    request.set('Authorization', `Bearer ${this.token}`);
    request.set('accept', 'json');
    return request;
  }

  checkToken() {
    if(this.token && this.tokenExpiry < Date.now()) {
      return Promise.resolve();
    }

    if(this.refreshToken) {
      return this.reAuth();
    }

    return Promise.reject();
  }

  checkLogin() {
    const {authBaseUrl} = this.config;
    return this.request(true)
      .then(request => {
        return request.get(`${authBaseUrl}/profile`);
      })
      .then(resp => resp.body);
  }

  request(auth = true) {
    if(!auth) {
      return http.agent();
    }

    // console.log(this.token);
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