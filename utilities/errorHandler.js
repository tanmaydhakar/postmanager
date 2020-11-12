const getErrorMessage = function (err) {
  console.log(err);
  const errResponse = {};
  errResponse.statusCode = err.statusCode;
  errResponse.message = err.message;
  return errResponse;
};

module.exports = {
  getErrorMessage
};
