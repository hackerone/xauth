class BaseError extends Error {
  constructor(name, message, errors, ...rest) {
    super(message, ...rest);
    this.name = name;
    this.message = message;
    this.errors = errors;
  }
}

class ValidationError extends BaseError {
  constructor(message, errors, ...rest) {
    super('ValidationError', message, errors, ...rest);
  }
}

class AuthError extends BaseError {
  constructor(message, errors, ...rest) {
    super('AuthError', message, errors, ...rest);
  }
}

module.exports = {
  ValidationError,
  AuthError,
}