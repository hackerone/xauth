const errorFactory = (name, message, errors) => {
  const e = new Error(message);
  e.name = name;
  e.errors = errors;
  return e;
}

const ValidationError = (message, errors = {}) => {
  return errorFactory('ValidationError', message, errors);
}


module.exports = {
  ValidationError
}