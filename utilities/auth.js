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

  const where = {
    token: userToken
  };
  let token = await Token.findOne({ where, include: [{ all: true, nested: true }] });
  if (!token) {
    return res.status(401).json({ message: 'Failed to authorize token' });
  }
  token = token.toJSON();
  const userDetails = {};
  userDetails.id = token.user.id;
  userDetails.username = token.user.username;
  userDetails.email = token.user.email;
  userDetails.password = token.user.password;
  userDetails.role = token.user.userRole.role.name;
  userDetails.token = token.token;

  req.user = userDetails;
  return next();
};

const isAdmin = async function (req, res, next) {
  if (req.user.role === 'admin') {
    return res.status(403).json({ message: 'You cant access this resource' });
  }
  return next();
};

module.exports = {
  verifyToken,
  isAdmin
};
