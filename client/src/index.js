import http from 'superagent';

class RestClient {
  constructor({
    authBaseUrl = '/auth',
    storage = localStorage,
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
    return parseInt(this.storage.getItem(this.config.TOKEN_EXPIRY));
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
    this.tokenExpiry = Date.now() + parseInt(body.expiresIn)*1000;
    if(body.user) {
      this.profile = body.user;
    }
    return body;
  }

  authRequest = (url, email, password) => {
    return http.post(url)
      .set('accept', 'json')
      .send({user: {email, password}})
      .then(this.handleTokenResponse);
  }

  authSocialRequest = (url, code) => {
    return http.get(url)
      .query({code})
      .then(this.handleTokenResponse);
  }

  reAuth = () => {
    const {authBaseUrl} = this.config;
    return this.request(false)
      .post(`${authBaseUrl}/token`)
      .send({user: { refreshToken: this.refreshToken }})
      .then(this.handleTokenResponse);
  }

  login = (email, password) => {
    const {authBaseUrl} = this.config;
    return this.authRequest(`${authBaseUrl}/login`, email, password);
  }

  register = (email, password) => {
    const {authBaseUrl} = this.config;
    return this.authRequest(`${authBaseUrl}/register`, email, password);
  }

  socialLogin = (type = 'google', code) => {
    const {authBaseUrl} = this.config;
    return this.authSocialRequest(`${authBaseUrl}/${type}/callback`, code);
  }

  logout = () => {
    const {TOKEN, REFRESH_TOKEN, TOKEN_EXPIRY} = this.config;
    this.storage.removeItem(REFRESH_TOKEN);
    this.storage.removeItem(TOKEN);
    this.storage.removeItem(TOKEN_EXPIRY);
    this.storage.clear();
    return Promise.resolve();
  }

  auth = (request) => {
    request.set('Authorization', `Bearer ${this.token}`);
    request.set('accept', 'json');
    return request;
  }

  checkToken = () => {
    // console.log(this.token, this.tokenExpiry, Date.now());
    if(this.token && this.tokenExpiry > Date.now()) {
      return Promise.resolve();
    }

    if(this.refreshToken) {
      return this.reAuth();
    }

    return Promise.reject();
  }

  checkLogin = () => {
    const {authBaseUrl} = this.config;
    return this.request(true)
      .then(request => {
        return request.get(`${authBaseUrl}/profile`);
      })
      .then(resp => resp.body);
  }

  request = (auth = true) => {
    if(!auth) {
      return http.agent();
    }

    return this.checkToken()
      .then(() => {
        return http.agent()
          .use((request) => {
            return this.auth(request);
          })
      })
      .catch(() => {
        this.logout();
        return Promise.reject();
      });
  }
}

export default RestClient;