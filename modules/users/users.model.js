const { Model } = require('sequelize');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.Token, { as: 'token', foreignKey: 'user_id' });
      this.hasOne(models.UserRole, { as: 'userRole', foreignKey: 'user_id' });
    }
  }
  User.init(
    {
      username: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'User'
    }
  );

  User.beforeCreate(function (model, options) {
    return new Promise(resolve => {
      const encryptedPassword = bcrypt.hashSync(model.password, 10);
      model.password = encryptedPassword;
      return resolve(null, options);
    });
  });

  User.afterCreate(async user => {
    const db = require(path.resolve('./models'));
    const { Role, UserRole } = db;
    const field = {
      name: 'user'
    };
    const role = await Role.findBySpecificField(field);

    const userRole = new UserRole();
    userRole.user_id = user.id;
    userRole.role_id = role.id;
    await userRole.save();
  });

  User.findBySpecificField = async function (fields) {
    const queryOptions = {
      where: fields
    };

    const user = await User.findOne(queryOptions);
    return user;
  };

  User.generateAuthToken = async function () {
    return crypto.randomBytes(64).toString('hex');
  };

  return User;
};
