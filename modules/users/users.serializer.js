const registerUser = async function (user) {
  const finalUser = {};

  finalUser.username = user.username;
  finalUser.email = user.email;
  return finalUser;
};

const loginUser = async function (user, token) {
  const finalUser = {};

  finalUser.username = user.username;
  finalUser.email = user.email;
  finalUser.token = token;
  return finalUser;
};

module.exports = {
  registerUser,
  loginUser
};
