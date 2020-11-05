const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Post.belongsTo(models.Users, { as: 'user', foreignKey: 'id' });
    }
  }
  Post.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      message: {
        type: DataTypes.TEXT
      },
      image_url: {
        type: DataTypes.TEXT
      },
      status: {
        type: DataTypes.ENUM('Scheduled', 'Posted'),
        defaultValue: 'Scheduled'
      },
      scheduled_date: {
        type: DataTypes.DATE
      },
      post_id: {
        type: DataTypes.STRING
      }
    },
    {
      sequelize,
      modelName: 'Post'
    }
  );

  return Post;
};
