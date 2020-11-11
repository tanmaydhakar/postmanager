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

const index = async function (posts) {
  const finalPosts = [];

  if (posts.length) {
    for (let i = 0; i <= posts.length - 1; i += 1) {
      const finalPost = {};
      finalPost.id = posts[i].id;
      finalPost.message = posts[i].message;
      finalPost.image_url = posts[i].image_url;
      finalPost.scheduled_date = posts[i].scheduled_date;
      finalPost.user_id = posts[i].user_id;
      finalPost.status = posts[i].status;

      finalPosts.push(post);
    }
  }

  return finalPosts;
};

module.exports = {
  post,
  index
};
