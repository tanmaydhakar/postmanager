const path = require('path');

const db = require(path.resolve('./models/index'));
const { User } = db;

const verifyToken = async function (req, res, next) {
  if (!req.headers.authorization) {
    return res.status(404).json({ message: 'Authorization header not provided' });
  }
  const token = req.headers.authorization;
  if (!token) {
    return res.status(404).json({ message: 'Token not provided' });
  }

  const user = await User.verifyToken(token);

  if (!user) {
    return res.status(401).json({ message: 'Failed to authorize token' });
  }
  req.user = user;
  return next();
};

module.exports = {
  verifyToken
};
