const { Model } = require('sequelize');
const schedule = require('node-schedule');

module.exports = (sequelize, DataTypes) => {
  class ScheduledPost extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Post, { as: 'post', foreignKey: 'id' });
    }
  }
  ScheduledPost.init(
    {
      post_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Posts',
          key: 'id'
        }
      },
      scheduled_function: {
        type: DataTypes.STRING
      },
      scheduled_date: {
        type: DataTypes.DATE
      }
    },
    {
      sequelize,
      modelName: 'Scheduled_post'
    }
  );

  ScheduledPost.findBySpecificField = async function (fields) {
    const queryOptions = {
      where: fields
    };

    const scheduledPost = await ScheduledPost.findOne(queryOptions);
    return scheduledPost;
  };

  ScheduledPost.destroyScheduledPost = async function (postId) {
    const field = {
      post_id: postId
    };
    const scheduledPost = await ScheduledPost.findBySpecificField(field);

    const jobList = schedule.scheduledJobs;
    const job = jobList[scheduledPost.scheduled_function];
    if (job) {
      job.cancel();
    }

    await scheduledPost.destroy();
  };

  return ScheduledPost;
};
