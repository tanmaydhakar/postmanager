const path = require('path');
const bcrypt = require('bcrypt');

const db = require(path.resolve('./models'));
const errorHandler = require(path.resolve('./utilities/errorHandler'));
const serializer = require(path.resolve('./modules/users/users.serializer'));
const err = new Error();
const { User, Role, UserRole, Token } = db;

const register = async function (req, res) {
  const user = new User();
  user.username = req.body.username;
  user.email = req.body.email;
  user.password = req.body.password;
  await user.save();

  const field = {
    name: 'user'
  };
  const role = await Role.findBySpecificField(field);

  const userRole = new UserRole();
  userRole.user_id = user.id;
  userRole.role_id = role.id;
  await userRole.save();

  const responseData = await serializer.registerUser(user);
  return res.status(200).json({ user: responseData });
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
      const userToken = await User.generateAuthToken();
      const token = new Token();
      token.user_id = user.id;
      token.token = userToken;
      await token.save();

      const responseData = await serializer.loginUser(user, userToken);
      return res.status(200).json({ user: responseData });
    }
  } catch (error) {
    const errorResponse = errorHandler.getErrorMessage(error);
    return res.status(errorResponse.statusCode).json({ message: errorResponse.message });
  }
};

const logout = async function (req, res) {
  const userToken = req.headers.authorization;
  await Token.destroyToken(userToken);

  return res.status(200).json({ status: 'User loggedout successfully' });
};

module.exports = {
  register,
  login,
  logout
};
