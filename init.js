const path = require('path');

const schedule = require(path.resolve('./utilities/schedulePost'));
const events = require(path.resolve('./utilities/events'));

const initialize = async function () {
  await schedule.reschedulePosts();
  await events.generateOauthUrl();
};

module.exports = {
  initialize
};
