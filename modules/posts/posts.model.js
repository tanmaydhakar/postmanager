const { Model } = require('sequelize');
const path = require('path');

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

  Post.afterCreate(async post => {
    const mail = require(path.resolve('./utilities/mail'));

    mail.sendMail(post, 'Post Created');
  });

  Post.afterUpdate(async post => {
    if (post._previousDataValues.status === 'Pending' && post.dataValues.status === 'Scheduled') {
      if (new Date(post.dataValues.scheduled_date).getTime() < new Date().getTime()) {
        return Post.updateStatus('Error', post.dataValues.id);
      }
      const schedule = require(path.resolve('./utilities/schedulePost'));
      await schedule.schedulePost(post);
    } else if (
      post._previousDataValues.status === 'Scheduled' &&
      post.dataValues.status !== 'Error'
    ) {
      const db = require(path.resolve('./models'));
      const { Scheduled_post } = db;

      Scheduled_post.destroyScheduledPost(post.id);
    }
  });

  Post.afterDestroy(async post => {
    if (post._previousDataValues.status === 'Scheduled') {
      const db = require(path.resolve('./models'));
      const { Scheduled_post } = db;

      Scheduled_post.destroyScheduledPost(post.id);
    }
  });

  Post.updateStatus = async function (status, postId) {
    const post = await Post.findByPk(postId);
    post.status = status;
    post.save();

    return post;
  };

  return Post;
};
