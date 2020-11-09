const post = async function (post) {
  const finalPost = {};

  finalPost.id = post.id;

  finalPost.message = post.message;
  finalPost.image_url = post.image_url;
  finalPost.scheduled_date = post.scheduled_date;
  finalPost.user_id = post.user_id;
  finalPost.status = post.status;
  return finalPost;
};

module.exports = {
  post
};
