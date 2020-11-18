const path = require('path');

const eventController = require(path.resolve('./modules/events/events.controller'));

module.exports = function (router) {
  router.get('/api/events/callback', eventController.getOauth);
};
