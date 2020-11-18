const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {}
  }
  Event.init(
    {
      name: {
        type: DataTypes.STRING,
        require: true
      },
      start: {
        type: DataTypes.DATE,
        require: true
      },
      end: {
        type: DataTypes.DATE,
        require: true
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Mailed'),
        defaultValue: 'Pending'
      }
    },
    {
      sequelize,
      modelName: 'Event'
    }
  );

  Event.findBySpecificField = async function (fields) {
    const queryOptions = {
      where: fields
    };

    const event = await Event.findOne(queryOptions);
    return event;
  };

  Event.updateStatus = async function (eventId, status) {
    const event = await Event.findByPk(eventId);
    event.status = status;
    await event.save();
  };

  return Event;
};
