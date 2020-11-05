const path = require('path');
const db = require(path.resolve('./models/index'));
const auth = require(path.resolve('./utilities/auth'));

const err = new Error();
const User = db.User;

const register = async function (req, res) {
  try {
    const user = new User();
    user.username = req.body.username;
    user.email = req.body.email;
    user.password = req.body.password;
    user.save();

    return res.status(200).json({ user });
  } catch (error) {
    const errorResponse = errorHandler.getErrorMsg(error);
    return res.status(errorResponse.statusCode).json({ message: errorResponse.message });
  }
};

const login = async function (req, res) {
  try {
    const field = {
      username: req.body.username
    };
    const user = await User.findBySpecificField(field);
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      err.statusCode(400);
      err.message = 'Invalid username or password';
      throw err;
    } else {
      const token = await User.generateAuthToken();
      user.tokens.push(token);
      user.save();
      return res.status(200).json({ token });
    }
  } catch (error) {
    const errorResponse = errorHandler.getErrorMsg(error);
    return res.status(errorResponse.statusCode).json({ message: errorResponse.message });
  }
};

const logout = async function (req, res) {
  try {
    await auth.revokeToken(req);
    return res.status(200).json({ status: 'User loggedout successfully' });
  } catch (error) {
    const errorResponse = errorHandler.getErrorMsg(error);
    return res.status(errorResponse.statusCode).json({ message: errorResponse.message });
  }
};

module.exports = {
  register,
  login,
  logout
};
