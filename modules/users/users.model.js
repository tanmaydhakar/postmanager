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
      // define association here
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
      },
      roles: {
        type: DataTypes.ARRAY(DataTypes.STRING)
      },
      tokens: {
        type: DataTypes.ARRAY(DataTypes.STRING)
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

  User.findBySpecificField = async function (fields) {
    const queryOptions = {
      where: fields
    };

    const user = await User.findOne(queryOptions);
    return user;
  };

  User.verifyToken = async function (token) {
    const queryOptions = {
      where: {
        tokens: {
          [Op.in]: token
        }
      }
    };

    const user = await User.findOne(queryOptions);
    return user;
  };

  User.generateAuthToken = async function () {
    return crypto.randomBytes(64).toString('hex');
  };

  User.manageAuthToken = async function (type, token, username) {
    let query;

    if (type === 'append') {
      query = sequelize.fn('array_append', sequelize.col('tokens'), token);
    } else if (type === 'remove') {
      query = sequelize.fn('array_remove', sequelize.col('tokens'), token);
    } else {
      query = [];
    }

    await User.update(
      {
        tokens: query
      },
      {
        where: {
          username
        }
      }
    );
  };

  return User;
};
