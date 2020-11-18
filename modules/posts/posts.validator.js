const path = require('path');

const db = require(path.resolve('./models'));
const { param, body, validationResult } = require('express-validator');

const { Post } = db;

const createRules = [
  body('scheduled_date')
    .exists()
    .withMessage('scheduled_date does not exists')
    .isString()
    .withMessage('scheduled_date must be string')
    .trim()
    .custom(value => {
      if (isNaN(new Date(value).getTime()) || new Date(value).getTime() < new Date().getTime()) {
        return Promise.reject(new Error('scheduled_date is invalid'));
      }
      return true;
    })
];

const approveRules = [
  param('postId')
    .exists()
    .withMessage('postId does not exists')
    .custom(async function (value) {
      const post = await Post.findByPk(value);
      if (!post) {
        return Promise.reject(new Error('Invalid postId'));
      }
      if (post.status !== 'Pending') {
        return Promise.reject(new Error('Post cant be updated now'));
      }
      return true;
    })
];

const rejectRules = [
  param('postId')
    .exists()
    .withMessage('postId does not exists')
    .custom(async function (value) {
      const post = await Post.findByPk(value);
      if (!post) {
        return Promise.reject(new Error('Invalid postId'));
      }
      if (post.status !== 'Pending') {
        return Promise.reject(new Error('Post cant be updated now'));
      }
      return true;
    })
];

const updateRules = [
  param('postId')
    .exists()
    .withMessage('postId does not exists')
    .custom(async function (value) {
      const post = await Post.findByPk(value);
      if (!post) {
        return Promise.reject(new Error('Invalid postId'));
      }
      if (post.status !== 'Pending' && post.status !== 'Scheduled') {
        return Promise.reject(new Error('Post cant be updated now'));
      }
      return true;
    }),
  body('scheduled_date')
    .exists()
    .withMessage('scheduled_date does not exists')
    .isString()
    .withMessage('scheduled_date must be string')
    .trim()
    .custom(value => {
      if (isNaN(new Date(value).getTime()) || new Date(value).getTime() < new Date().getTime()) {
        return Promise.reject(new Error('scheduled_date is invalid'));
      }
      return true;
    })
];

const destroyRules = [
  param('postId')
    .exists()
    .withMessage('postId does not exists')
    .custom(async function (value) {
      const post = await Post.findByPk(value);
      if (!post) {
        return Promise.reject(new Error('Invalid postId'));
      }
      if (post.status !== 'Pending' && post.status !== 'Scheduled') {
        return Promise.reject(new Error('Post cant be updated now'));
      }
      return true;
    })
];

const showRules = [
  param('postId')
    .exists()
    .withMessage('postId does not exists')
    .custom(async function (value) {
      const post = await Post.findByPk(value);
      if (!post) {
        return Promise.reject(new Error('Invalid postId'));
      }
      return true;
    })
];

const verifyRules = function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = errors.array().shift();
    return res.status(422).json({ message: error });
  }
  return next();
};

module.exports = {
  verifyRules,
  createRules,
  approveRules,
  rejectRules,
  updateRules,
  destroyRules,
  showRules
};
