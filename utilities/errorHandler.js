const getErrorMessage = function (err) {
  console.log(err);
  const errResponse = {};
  err.statusCode = err.statusCode || 500;
  errResponse.statusCode = err.statusCode;
  errResponse.message = err.message;
  return errResponse;
};

module.exports = {
  getErrorMessage
};
