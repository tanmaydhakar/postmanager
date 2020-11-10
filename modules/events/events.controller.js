const path = require('path');

const errorHandler = require(path.resolve('./utilities/errorHandler'));
const events = require(path.resolve('./utilities/events'));

const getOauth = async function (req, res) {
  try {
    console.log('Scheduling Events');
    await events.getEvents(req.query.code);
    return res.status(200).json({ status: 'Scheduling Events' });
  } catch (error) {
    const errorResponse = errorHandler.getErrorMessage(error);
    return res.status(errorResponse.statusCode).json({ message: errorResponse.message });
  }
};

module.exports = {
  getOauth
};
