const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserRole extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.Role, { as: 'role', sourceKey: 'role_id', foreignKey: 'id' });
    }
  }
  UserRole.init(
    {
      user_id: {
        type: DataTypes.INTEGER
      },
      role_id: {
        type: DataTypes.INTEGER
      }
    },
    {
      sequelize,
      modelName: 'UserRole'
    }
  );

  return UserRole;
};
