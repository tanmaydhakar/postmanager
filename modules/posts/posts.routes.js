const path = require('path');

const rules = require(path.resolve('./modules/posts/posts.validator'));
const auth = require(path.resolve('./utilities/auth'));
const postController = require(path.resolve('./modules/posts/posts.controller'));

module.exports = function (router) {
  router.post(
    '/api/post',
    auth.verifyToken,
    rules.createRules,
    rules.verifyRules,
    postController.create
  );

  router.patch(
    '/api/post/:postId/approve',
    auth.verifyToken,
    auth.isAdmin,
    rules.approveRules,
    rules.verifyRules,
    postController.approve
  );

  router.patch(
    '/api/post/:postId/reject',
    auth.verifyToken,
    auth.isAdmin,
    rules.rejectRules,
    rules.verifyRules,
    postController.reject
  );

  router.patch(
    '/api/post/:postId',
    auth.verifyToken,
    rules.updateRules,
    rules.verifyRules,
    postController.update
  );

  router.delete(
    '/api/login',
    auth.verifyToken,
    rules.destroyRules,
    rules.verifyRules,
    postController.destroy
  );
};
