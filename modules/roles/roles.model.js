const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.UserRole, { as: 'role', sourceKey: 'role_id', foreignKey: 'id' });
    }
  }
  Role.init(
    {
      name: {
        type: DataTypes.STRING
      }
    },
    {
      sequelize,
      modelName: 'Role'
    }
  );

  Role.findBySpecificField = async function (fields) {
    const queryOptions = {
      where: fields
    };

    const role = await Role.findOne(queryOptions);
    return role;
  };

  return Role;
};
