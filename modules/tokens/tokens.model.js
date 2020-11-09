const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Token extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.User, { as: 'user', sourceKey: 'user_id', foreignKey: 'id' });
    }
  }
  Token.init(
    {
      user_id: {
        type: DataTypes.INTEGER
      },
      token: {
        type: DataTypes.STRING
      }
    },
    {
      sequelize,
      modelName: 'Token'
    }
  );

  Token.findBySpecificField = async function (fields) {
    const queryOptions = {
      where: fields
    };

    const token = await Token.findOne(queryOptions);
    return token;
  };

  Token.destroyToken = async function (userToken) {
    const token = await Token.findOne({
      where: {
        token: userToken
      }
    });

    await token.destroy();
  };

  return Token;
};
