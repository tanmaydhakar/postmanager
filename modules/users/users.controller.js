const path = require('path');
const bcrypt = require('bcrypt');

const db = require(path.resolve('./models'));
const errorHandler = require(path.resolve('./utilities/errorHandler'));
const err = new Error();
const { User } = db;

const register = async function (req, res) {
  try {
    const user = new User();
    user.username = req.body.username;
    user.email = req.body.email;
    user.password = req.body.password;
    await user.save();
    return res.status(200).json({ user });
  } catch (error) {
    const errorResponse = errorHandler.getErrorMessage(error);
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
      err.statusCode = 400;
      err.message = 'Invalid username or password';
      throw err;
    } else {
      const token = await User.generateAuthToken();
      await User.addAuthToken('append', token, user.username);
      return res.status(200).json({ token });
    }
  } catch (error) {
    const errorResponse = errorHandler.getErrorMessage(error);
    return res.status(errorResponse.statusCode).json({ message: errorResponse.message });
  }
};

const logout = async function (req, res) {
  try {
    const token = req.headers.authorization.split(' ')[1];
    await User.addAuthToken('remove', token, req.user.username);
    return res.status(200).json({ status: 'User loggedout successfully' });
  } catch (error) {
    const errorResponse = errorHandler.getErrorMessage(error);
    return res.status(errorResponse.statusCode).json({ message: errorResponse.message });
  }
};

module.exports = {
  register,
  login,
  logout
};
