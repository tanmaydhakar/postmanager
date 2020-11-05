const db = require(path.resolve('./models/index'));
const core = require(path.resolve('./utilities/core'));

const User = db.User;

const verifyToken = function (req, res, next) {
  const token = req.headers.authorization.split(' ')[1];
  if (token) {
    return res.status(404).json({ message: 'Token not provided' });
  }
  
  const user = await User.verifyToken(token);

  if(!user){
    return res.status(401).json({ message: 'Failed to authorize token' });
  }else{
      req.user = user;
      return next();
  }
};

const revokeToken = async function ( req ){
    const token = req.headers.authorization.split(' ')[1];
    const user = await User.verifyToken(token);
    user.tokens = core.removeFromArray(user.tokens ,token);
    user.save();
    return user;
}

module.exports = {
    verifyToken,
    revokeToken
}