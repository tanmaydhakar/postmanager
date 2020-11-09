const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, { as: 'user', foreignKey: 'id' });
      this.hasOne(models.Scheduled_post, { as: 'scheduledPosts', foreignKey: 'post_id' });
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
        type: DataTypes.ENUM('Pending', 'Scheduled', 'Rejected', 'Posted', 'Error'),
        defaultValue: 'Pending'
      },
      scheduled_date: {
        type: DataTypes.DATE
      }
    },
    {
      sequelize,
      modelName: 'Post'
    }
  );

  Post.findBySpecificField = async function (fields) {
    const queryOptions = {
      where: fields
    };

    const post = await Post.findOne(queryOptions);
    return post;
  };

  Post.updateStatus = async function (status, postId) {
    const post = await Post.findByPk(postId);
    post.status = status;
    post.save();

    return post;
  };

  return Post;
};
