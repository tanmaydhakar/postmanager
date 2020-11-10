const path = require('path');

// const rules = require(path.resolve('./modules/posts/posts.validator'));
// const auth = require(path.resolve('./utilities/auth'));
const eventController = require(path.resolve('./modules/events/events.controller'));

module.exports = function (router) {
  router.get('/api/events/callback', eventController.getOauth);
};
