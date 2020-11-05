const path = require('path');

const rules = require(path.resolve('./modules/users/users.validator'));
const auth = require(path.resolve('./utilities/auth'));
const userController = require(path.resolve('./modules/users/users.controller'));

module.exports = function (router) {
  router.post('/api/login', rules.loginRules, rules.verifyRules, userController.login);

  router.get('/api/logout', auth.verifyToken, userController.logout);

  router.post('/api/register', rules.registerRules, rules.verifyRules, userController.register);
};
