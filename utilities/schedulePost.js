const schedule = require('node-schedule');
const axios = require('axios');
const path = require('path');

const db = require(path.resolve('./models'));
const { Post } = db;
const { Scheduled_post } = db;

const schedulePost = async function (post) {
  const queryData = {};
  queryData.message = post.message ? post.message : undefined;
  queryData.url = post.imageUrl ? post.imageUrl : undefined;
  queryData.access_token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  const job = schedule.scheduleJob(post.scheduled_date, function () {
    axios({
      method: 'post',
      url: `https://graph.facebook.com/${process.env.facebook_pageid}/feed`,
      data: queryData
    })
      .then(() => {
        Post.updateStatus('Posted', post.id);
      })
      .catch(() => {
        Post.updateStatus('Error', post.id);
      });
  });

  const scheduledPost = new Scheduled_post();
  scheduledPost.post_id = post.id;
  scheduledPost.scheduled_function = job.name;
  scheduledPost.scheduled_date = post.scheduled_date;
  await scheduledPost.save();
};

const reschedulePosts = async function () {
  console.log('Scheduling Posts');
  await Scheduled_post.destroy({ where: {} });

  const posts = await Post.findAll({
    where: {
      status: 'Scheduled'
    },
    raw: true
  });
  if (posts.length) {
    for (let i = 0; i <= posts.length - 1; i += 1) {
      if (new Date(posts[i].scheduled_date) <= new Date()) {
        Post.updateStatus('Error', post.id);
      } else {
        await schedulePost(posts[i]);
      }
    }
  }
  console.log('Posts scheduled');
};

module.exports = {
  schedulePost,
  reschedulePosts
};
