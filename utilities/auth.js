const path = require('path');

const db = require(path.resolve('./models'));
const { Token } = db;

const verifyToken = async function (req, res, next) {
  if (!req.headers.authorization) {
    return res.status(404).json({ message: 'Authorization header not provided' });
  }
  const userToken = req.headers.authorization;
  if (!userToken) {
    return res.status(404).json({ message: 'Token not provided' });
  }

  const field = {
    token: userToken
  };
  const token = await Token.findBySpecificField(field);

  if (!token) {
    return res.status(401).json({ message: 'Failed to authorize token' });
  }
  let user = await token.getUser();
  const userRole = await user.getRole();
  user = user.toJSON();
  user.token = userToken;
  user.roles = userRole;
  req.user = user;

  return next();
};

module.exports = {
  verifyToken
};
