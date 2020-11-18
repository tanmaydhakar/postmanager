const path = require('path');

const events = require(path.resolve('./utilities/events'));

const getOauth = async function (req, res) {
  res.status(200).json({ status: 'Scheduling Events' });
  return events.getEvents(req.query.code);
};

module.exports = {
  getOauth
};
