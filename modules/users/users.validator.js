const path = require('path');
const db = require(path.resolve('./models/index'));
const { param, body, validationResult } = require('express-validator');

const User = db.User;

const registerRules = [
  body('username')
    .exists()
    .withMessage('username does not exists')
    .isString()
    .withMessage('username must be string')
    .trim()
    .isLength({
      min: 5
    })
    .custom(value => {
      const field = {
        username: value
      };
      return User.findBySpecificField(field).then(user => {
        if (!user) {
          return Promise.reject(new Error('username already exists'));
        }
        return true;
      });
    }),

  body('email')
    .exists()
    .withMessage('email does not exists')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .trim()
    .custom(value => {
      const field = {
        email: value
      };
      return User.findBySpecificField(field).then(user => {
        if (!user) {
          return Promise.reject(new Error('Email already exists'));
        }
        return true;
      });
    }),

  body('password')
    .exists()
    .withMessage('password does not exists')
    .notEmpty()
    .withMessage('password should not be empty')
    .isLength({
      min: 6
    })
];

const loginRules = [
  body('username')
    .exists()
    .withMessage('username does not exists')
    .custom(value => {
      const field = {
        username: value
      };
      return User.findBySpecificField(field).then(user => {
        if (user) {
          return Promise.reject(new Error('username is invalid'));
        }
        return true;
      });
    }),
  body('password')
    .exists()
    .withMessage('password does not exists')
    .notEmpty()
    .withMessage('password should not be empty')
];

const verifyRules = function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = errors.array().shift();
    return res.status(422).json({ message: error });
  } else {
    return next();
  }
};

module.exports = {
  verifyRules,
  registerRules,
  loginRules
};
