const path = require('path');

const db = require(path.resolve('./models'));
const errorHandler = require(path.resolve('./utilities/errorHandler'));
const serializer = require(path.resolve('./modules/posts/posts.serializer'));
const schedule = require(path.resolve('./utilities/schedulePost'));
const mail = require(path.resolve('./utilities/mail'));
const err = new Error();
const { Post } = db;
const { Scheduled_post } = db;
const postStatus = ['Pending', 'Scheduled', 'Rejected', 'Posted', 'Error'];

const create = async function (req, res) {
  try {
    if (!req.body.message && !req.file) {
      err.statusCode = 400;
      err.message = 'Post cant be empty';
      throw err;
    }

    const post = new Post();
    post.message = req.body.message ? req.body.message : null;
    post.image_url = req.file ? req.file.location : null;
    post.scheduled_date = new Date(req.body.scheduled_date);
    post.user_id = req.user.id;
    await post.save();

    const responseData = await serializer.post(post);
    res.status(201).json({ post: responseData });

    const mailData = {};
    mailData.to = [req.user.email];
    mailData.subject = 'Your post has been created successfully!';
    mailData.post = post;
    return mail.sendMail(mailData, 'Post Created');
  } catch (error) {
    const errorResponse = errorHandler.getErrorMessage(error);
    return res.status(errorResponse.statusCode).json({ message: errorResponse.message });
  }
};

const approve = async function (req, res) {
  const post = await Post.findByPk(req.params.postId);
  await schedule.schedulePost(post);

  post.status = 'Scheduled';
  await post.save();

  const responseData = await serializer.post(post);
  return res.status(200).json({ post: responseData });
};

const reject = async function (req, res) {
  const post = await Post.findByPk(req.params.postId);
  post.status = 'Rejected';
  await post.save();

  const responseData = await serializer.post(post);
  return res.status(200).json({ post: responseData });
};

const update = async function (req, res) {
  try {
    if (!req.body.message && !req.file) {
      err.statusCode = 400;
      err.message = 'Post cant be empty';
      throw err;
    }
    const post = await Post.findByPk(req.params.postId);

    post.message = req.body.message ? req.body.message : null;
    post.image_url = req.file ? req.file.location : null;
    post.scheduled_date = new Date(req.body.scheduled_date);
    post.status = 'Pending';
    post.save();

    const responseData = await serializer.post(post);
    res.status(200).json({ post: responseData });
    if (post.status === 'Scheduled') {
      return Scheduled_post.destroyScheduledPost(post.id);
    }
    return post;
  } catch (error) {
    const errorResponse = errorHandler.getErrorMessage(error);
    return res.status(errorResponse.statusCode).json({ message: errorResponse.message });
  }
};

const destroy = async function (req, res) {
  const post = await Post.findByPk(req.params.postId);

  await post.destroy();

  res.status(200).json({ status: 'Post deleted successfully' });
  if (post.status === 'Scheduled') {
    await Scheduled_post.destroyScheduledPost(post.id);
  }
};

const show = async function (req, res) {
  try {
    const post = await Post.findByPk(req.params.postId);
    if (req.user.role === 'admin' || req.user.id === post.user_id) {
      const responseData = await serializer.post(post);
      return res.status(200).json({ post: responseData });
    }
    err.statusCode = 401;
    err.message = 'User unauthorized to access this resource';
    throw err;
  } catch (error) {
    const errorResponse = errorHandler.getErrorMessage(error);
    return res.status(errorResponse.statusCode).json({ message: errorResponse.message });
  }
};

const index = async function (req, res) {
  const whereStatement = {};
  let sortBy;
  if (req.query.status && postStatus.includes(req.query.status)) {
    whereStatement.status = req.query.status;
  }

  if (req.query.sort === 'message') {
    sortBy = 'message asc';
  } else {
    sortBy = 'scheduled_date dec';
  }

  if (req.user.role !== 'admin') {
    whereStatement.user_id = req.user.id;
  }
  const posts = await Post.findAll({ where: whereStatement }, { order: sortBy });

  const responseData = await serializer.index(posts);
  return res.status(200).json({ posts: responseData });
};

module.exports = {
  create,
  approve,
  reject,
  update,
  destroy,
  show,
  index
};
