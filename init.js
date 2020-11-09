const path = require('path');

const schedule = require(path.resolve('./utilities/schedulePost'));

const initialize = async function () {
  await schedule.reschedulePosts();
};

module.exports = {
  initialize
};
