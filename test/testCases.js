const chai = require('chai');
const faker = require('faker');
const { expect } = require('chai');
const chaiHttp = require('chai-http');
const path = require('path');

const app = require(path.resolve('./index'));
const serializer = require(path.resolve('./modules/posts/posts.serializer'));
const db = require(path.resolve('./models'));
const { Post, Scheduled_post, User, Role } = db;

const apiBase = 'http://localhost:5002';
chai.use(chaiHttp);

describe('# Project APIs', () => {
  let adminToken;
  let userToken;
  let createPostResponse;
  let rejectPostResponse;
  let dummyUser;

  const todayDate = new Date();
  const tomorrowDate = new Date(todayDate.setDate(todayDate.getDate() + 1));
  const yesterdayDate = new Date(todayDate.setDate(todayDate.getDate() - 1));
  const username = faker.name.findName();
  const email = faker.internet.email();
  const password = 'User@123abc';

  const registerUser = function () {
    return new Promise(resolve => {
      const user = new User();
      user.username = faker.name.findName();
      user.email = faker.internet.email();
      user.password = password;

      user.save().then(() => {
        return resolve(user);
      });
    });
  };

  const createPost = function () {
    return new Promise(resolve => {
      registerUser().then(user => {
        const data = {
          scheduled_date: tomorrowDate,
          message: faker.random.words(10)
        };

        const post = new Post();
        post.message = data.message;
        post.image_url = null;
        post.scheduled_date = data.scheduled_date;
        post.user_id = user.id;
        post.save().then(() => {
          const responseData = serializer.post(post);
          return resolve(responseData);
        });
      });
    });
  };

  const updatePostStatus = function (postId, status) {
    return new Promise(resolve => {
      Post.findByPk(postId).then(post => {
        post.status = status;
        post.save().then(() => {
          const scheduledPost = new Scheduled_post();
          scheduledPost.post_id = post.id;
          scheduledPost.scheduled_function = 'test';
          scheduledPost.scheduled_date = post.scheduled_date;

          scheduledPost.save().then(() => {
            return resolve(post);
          });
        });
      });
    });
  };

  before(function (done) {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ username: 'dummyuser', password, email: 'dummyuser@mailinator.com' })
      .then(() => {
        chai
          .request(apiBase)
          .post('/api/login')
          .send({ username: 'dummyuser', password })
          .then(res => {
            dummyUser = res.body.user;
            done();
          });
      });
  });

  it('Success: logs in admin', done => {
    chai
      .request(apiBase)
      .post('/api/login')
      .send({ username: 'Admin123', password: 'Admin@123' })
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.user).to.have.property('username').to.equal('Admin123');
        expect(res.body.user).to.have.property('token');
        expect(res.body.user).to.have.property('email');
        adminToken = res.body.user.token;
        done();
      });
  });

  it('Fail: registers a user without username', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ password, email })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('username does not exists');
        done();
      });
  });

  it('Fail: registers a user without email', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ password, username })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('email does not exists');
        done();
      });
  });

  it('Fail: registers a user without password', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ email, username })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('password does not exists');
        done();
      });
  });

  it('Fail: registers a user with non string password', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ email, username, password: 123 })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('password must be string');
        done();
      });
  });

  it('Fail: registers a user with non 6 character password', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ email, username, password: 'abc1' })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('password should be minimum 6 characters');
        done();
      });
  });

  it('Fail: registers a user without small case in password', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ email, username, password: 'onlylowercase' })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Password should contain atleast one capital letter');
        done();
      });
  });

  it('Fail: registers a user without upper case in password', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ email, username, password: 'ONLYUPPERCASE' })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Password should contain atleast one small letter');
        done();
      });
  });

  it('Fail: registers a user without special charater in password', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ email, username, password: 'Abc123abc' })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal(
          'Password should contain atleast one special character'
        );
        done();
      });
  });

  it('Fail: registers a user with invalid email', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ password, email: username, username })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Invalid email format');
        done();
      });
  });

  it('Fail: registers a user without string username', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ username: 123, password, email })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('username must be string');
        done();
      });
  });

  it('Fail: registers a user with less than 5 letter username', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ username: 'abcd', password, email })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('username should be minimum 5 characters');
        done();
      });
  });

  it('Success: registers a user', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ username, password, email })
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('user');
        expect(res.body.user).to.include({ username, email });
        done();
      });
  });

  it('Fail: registers a user with already taken username', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ username, password, email })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('username already exists');
        done();
      });
  });

  it('Fail: registers a user with already taken email', done => {
    chai
      .request(apiBase)
      .post('/api/register')
      .send({ username: username + 1, password, email })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Email already exists');
        done();
      });
  });

  it('Fail: log in a user without username', done => {
    chai
      .request(apiBase)
      .post('/api/login')
      .send({ password })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('username does not exists');
        done();
      });
  });

  it('Fail: log in a user without password', done => {
    chai
      .request(apiBase)
      .post('/api/login')
      .send({ username })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('password does not exists');
        done();
      });
  });

  it('Fail: log in a user with empty password', done => {
    chai
      .request(apiBase)
      .post('/api/login')
      .send({ password: '', username })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('password should not be empty');
        done();
      });
  });

  it('Fail: log in a user with invalid username', done => {
    chai
      .request(apiBase)
      .post('/api/login')
      .send({ username: username + 1, password })
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('username is invalid');
        done();
      });
  });

  it('Fail: log in a user with invalid password', done => {
    chai
      .request(apiBase)
      .post('/api/login')
      .send({ username, password: password + 1 })
      .then(res => {
        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message');
        expect(res.body.message).to.equal('Invalid username or password');
        done();
      });
  });

  it('Success: logs in a user', done => {
    chai
      .request(apiBase)
      .post('/api/login')
      .send({ username, password })
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('user');
        expect(res.body.user).to.have.property('token');
        expect(res.body.user).to.include({ username, email });
        userToken = res.body.user.token;
        done();
      });
  });

  it('Fail: request without auth token', done => {
    chai
      .request(apiBase)
      .get('/api/posts')
      .then(res => {
        expect(res.statusCode).to.equal(404);
        expect(res.body).to.have.property('message').to.equal('Authorization header not provided');
        done();
      });
  });

  it('Fail: request with invalid auth token', done => {
    chai
      .request(apiBase)
      .get('/api/posts')
      .set('Authorization', userToken + 1)
      .then(res => {
        expect(res.statusCode).to.equal(401);
        expect(res.body).to.have.property('message').to.equal('Failed to authorize token');
        done();
      });
  });

  it('Success: gets all posts for user', done => {
    chai
      .request(apiBase)
      .get('/api/posts')
      .set('Authorization', userToken)
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('posts');
        expect(res.body.posts).to.satisfy(posts => {
          if (Array.isArray(posts)) {
            return true;
          }
          return false;
        });
        done();
      });
  });

  it('Success: gets all posts for admin', done => {
    chai
      .request(apiBase)
      .get('/api/posts')
      .set('Authorization', adminToken)
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('posts');
        expect(res.body.posts).to.satisfy(posts => {
          if (Array.isArray(posts)) {
            return true;
          }
          return false;
        });
        done();
      });
  });

  it('Fail: creates a post without schedule date', done => {
    const data = {
      message: faker.random.words(10)
    };
    chai
      .request(apiBase)
      .post('/api/post')
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('scheduled_date does not exists');
        done();
      });
  });

  it('Fail: creates a post non string schedule date', done => {
    const data = {
      message: faker.random.words(10),
      scheduled_date: 123123123
    };
    chai
      .request(apiBase)
      .post('/api/post')
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('scheduled_date must be string');
        done();
      });
  });

  it('Fail: creates a post invalid schedule date', done => {
    const data = {
      message: faker.random.words(10),
      scheduled_date: 'notadate'
    };
    chai
      .request(apiBase)
      .post('/api/post')
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('scheduled_date is invalid');
        done();
      });
  });

  it('Fail: creates a post without message', done => {
    const data = {
      scheduled_date: tomorrowDate.toString()
    };
    chai
      .request(apiBase)
      .post('/api/post')
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message').to.equal('Post cant be empty');
        done();
      });
  });

  it('Success: creates a post with image', done => {
    const data = {
      scheduled_date: tomorrowDate.toString()
    };
    chai
      .request(apiBase)
      .post('/api/post')
      .set('Authorization', userToken)
      .attach('image', './test/tree.jpg', 'tree.jpg')
      .field(data)
      .then(res => {
        expect(res.statusCode).to.equal(201);
        expect(res.body).to.have.property('post');
        expect(res.body.post).to.have.property('id');
        expect(res.body.post).to.have.property('message').to.equal(null);
        expect(res.body.post).to.have.property('image_url');
        expect(res.body.post).to.have.property('status').to.equal('Pending');
        expect(res.body.post).to.have.property('scheduled_date');
        done();
      });
  });

  it('Success: creates a post', done => {
    const data = {
      scheduled_date: tomorrowDate.toString(),
      message: faker.random.words(10)
    };
    chai
      .request(apiBase)
      .post('/api/post')
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(201);
        expect(res.body).to.have.property('post');
        expect(res.body.post).to.have.property('id');
        expect(res.body.post).to.have.property('user_id');
        expect(res.body.post).to.have.property('message').to.equal(data.message);
        expect(res.body.post).to.have.property('image_url');
        expect(res.body.post).to.have.property('status').to.equal('Pending');
        expect(res.body.post).to.have.property('scheduled_date');
        createPostResponse = res.body;
        done();
      });
  });

  it('Success: gets a invalid post', done => {
    chai
      .request(apiBase)
      .get(`/api/post/0`)
      .set('Authorization', userToken)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Invalid postId');
        done();
      });
  });

  it('Success: gets a specific post', done => {
    chai
      .request(apiBase)
      .get(`/api/post/${createPostResponse.post.id}`)
      .set('Authorization', userToken)
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('post');
        expect(res.body).to.deep.equal(createPostResponse);

        done();
      });
  });

  it('Fail: gets a specific post that does not belongs to that user', done => {
    chai
      .request(apiBase)
      .get(`/api/post/${createPostResponse.post.id}`)
      .set('Authorization', dummyUser.token)
      .then(res => {
        expect(res.statusCode).to.equal(401);
        expect(res.body)
          .to.have.property('message')
          .to.equal('User unauthorized to access this resource');

        done();
      });
  });

  it('Fail: approve a specific post with invalid post id', done => {
    chai
      .request(apiBase)
      .patch(`/api/post/0/approve`)
      .set('Authorization', adminToken)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Invalid postId');
        done();
      });
  });

  it('Fail: reject a specific post with invalid post id', done => {
    chai
      .request(apiBase)
      .patch(`/api/post/0/reject`)
      .set('Authorization', adminToken)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Invalid postId');
        done();
      });
  });

  it('Success: approve a specific post', done => {
    chai
      .request(apiBase)
      .patch(`/api/post/${createPostResponse.post.id}/approve`)
      .set('Authorization', adminToken)
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('post');
        expect(res.body.post).to.have.property('id').to.equal(createPostResponse.post.id);
        expect(res.body.post).to.have.property('status').to.equal('Scheduled');
        done();
      });
  });

  it('Fail: approve a already approved post', done => {
    chai
      .request(apiBase)
      .patch(`/api/post/${createPostResponse.post.id}/approve`)
      .set('Authorization', adminToken)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Post cant be updated now');
        done();
      });
  });

  it('Fail: reject a approved post', done => {
    chai
      .request(apiBase)
      .patch(`/api/post/${createPostResponse.post.id}/reject`)
      .set('Authorization', adminToken)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Post cant be updated now');
        done();
      });
  });

  it('Fail: user tries to reject a post', done => {
    createPost().then(response => {
      createPostResponse = {
        post: response
      };
      chai
        .request(apiBase)
        .patch(`/api/post/${createPostResponse.post.id}/reject`)
        .set('Authorization', userToken)
        .then(res => {
          expect(res.statusCode).to.equal(403);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.equal('You cant access this resource');
          done();
        });
    });
  });

  it('Fail: user tries to approve a post', done => {
    chai
      .request(apiBase)
      .patch(`/api/post/${createPostResponse.post.id}/approve`)
      .set('Authorization', userToken)
      .then(res => {
        expect(res.statusCode).to.equal(403);
        expect(res.body).to.have.property('message');
        expect(res.body.message).to.equal('You cant access this resource');
        done();
      });
  });

  it('Fail: update a post without schedule date', done => {
    const data = {
      message: faker.random.words(10)
    };
    chai
      .request(apiBase)
      .patch(`/api/post/${createPostResponse.post.id}`)
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('scheduled_date does not exists');
        done();
      });
  });

  it('Fail: update a post without string schedule date', done => {
    const data = {
      scheduled_date: 123123123123,
      message: faker.random.words(10)
    };
    chai
      .request(apiBase)
      .patch(`/api/post/${createPostResponse.post.id}`)
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('scheduled_date must be string');
        done();
      });
  });

  it('Fail: update a post without valid schedule date', done => {
    const data = {
      scheduled_date: 'not a valid date',
      message: faker.random.words(10)
    };
    chai
      .request(apiBase)
      .patch(`/api/post/${createPostResponse.post.id}`)
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('scheduled_date is invalid');
        done();
      });
  });

  it('Fail: update a post with empty message', done => {
    const data = {
      scheduled_date: tomorrowDate
    };
    chai
      .request(apiBase)
      .patch(`/api/post/${createPostResponse.post.id}`)
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message').to.equal('Post cant be empty');
        done();
      });
  });

  it('Success: update a post with image', done => {
    const data = {
      scheduled_date: tomorrowDate.toString()
    };
    chai
      .request(apiBase)
      .patch(`/api/post/${createPostResponse.post.id}`)
      .set('Authorization', userToken)
      .attach('image', './test/tree.jpg', 'tree.jpg')
      .field(data)
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('post');
        expect(res.body.post).to.have.property('id');
        expect(res.body.post).to.have.property('message').to.equal(null);
        expect(res.body.post).to.have.property('image_url');
        expect(res.body.post).to.have.property('status').to.equal('Pending');
        expect(res.body.post).to.have.property('scheduled_date');
        done();
      });
  });

  it('Success: update a post', done => {
    const data = {
      scheduled_date: tomorrowDate,
      message: faker.random.words(10)
    };
    chai
      .request(apiBase)
      .patch(`/api/post/${createPostResponse.post.id}`)
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('post');
        expect(res.body.post).to.have.property('id');
        expect(res.body.post).to.have.property('user_id');
        expect(res.body.post).to.have.property('message').to.equal(data.message);
        expect(res.body.post).to.have.property('image_url');
        expect(res.body.post).to.have.property('status').to.equal('Pending');
        expect(res.body.post).to.have.property('scheduled_date');
        createPostResponse = res.body;
        done();
      });
  });

  it('Fail: update a post with invalid scheduled_date', done => {
    const data = {
      scheduled_date: yesterdayDate,
      message: faker.random.words({ count: 10 })
    };
    chai
      .request(apiBase)
      .patch(`/api/post/${createPostResponse.post.id}`)
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('scheduled_date is invalid');
        done();
      });
  });

  it('Fail: update a post with invalid postId', done => {
    const data = {
      scheduled_date: yesterdayDate,
      message: faker.random.words({ count: 10 })
    };
    chai
      .request(apiBase)
      .patch(`/api/post/0`)
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Invalid postId');
        done();
      });
  });

  it('Fail: update a post with invalid postId', done => {
    const data = {
      scheduled_date: yesterdayDate,
      message: faker.random.words({ count: 10 })
    };
    chai
      .request(apiBase)
      .patch(`/api/post/0`)
      .set('Authorization', userToken)
      .send(data)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Invalid postId');
        done();
      });
  });

  it('Success: rejects a post', done => {
    createPost().then(response => {
      createPostResponse = {
        post: response
      };
      chai
        .request(apiBase)
        .patch(`/api/post/${createPostResponse.post.id}/reject`)
        .set('Authorization', adminToken)
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.have.property('post');
          expect(res.body.post).to.have.property('id').to.equal(createPostResponse.post.id);
          expect(res.body.post).to.have.property('status').to.equal('Rejected');
          rejectPostResponse = res.body;
          done();
        });
    });
  });

  it('Fail: delete a rejected post', done => {
    chai
      .request(apiBase)
      .delete(`/api/post/${rejectPostResponse.post.id}`)
      .set('Authorization', userToken)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Post cant be updated now');
        done();
      });
  });

  it('Fail: delete a invalid post', done => {
    chai
      .request(apiBase)
      .delete(`/api/post/0`)
      .set('Authorization', userToken)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Invalid postId');
        done();
      });
  });

  it('Success: delete a post', done => {
    createPost().then(response => {
      createPostResponse = {
        post: response
      };
      updatePostStatus(createPostResponse.post.id, 'Scheduled').then(post => {
        chai
          .request(apiBase)
          .delete(`/api/post/${post.id}`)
          .set('Authorization', userToken)
          .then(res => {
            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('status').to.equal('Post deleted successfully');
            done();
          });
      });
    });
  });

  it('Success: update post after its scheduled', done => {
    createPost().then(response => {
      createPostResponse = {
        post: response
      };
      updatePostStatus(createPostResponse.post.id, 'Scheduled').then(post => {
        const data = {
          scheduled_date: tomorrowDate,
          message: faker.random.words(10)
        };
        chai
          .request(apiBase)
          .patch(`/api/post/${post.id}`)
          .set('Authorization', userToken)
          .send(data)
          .then(res => {
            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('post');
            expect(res.body.post).to.have.property('id');
            expect(res.body.post).to.have.property('message').to.equal(data.message);
            expect(res.body.post).to.have.property('image_url');
            expect(res.body.post).to.have.property('status').to.equal('Pending');
            expect(res.body.post).to.have.property('scheduled_date');
            done();
          });
      });
    });
  });

  it('Fail: update post after its posted', done => {
    createPost().then(response => {
      createPostResponse = {
        post: response
      };
      updatePostStatus(createPostResponse.post.id, 'Posted').then(post => {
        const data = {
          scheduled_date: tomorrowDate,
          message: faker.random.words(10)
        };
        chai
          .request(apiBase)
          .patch(`/api/post/${post.id}`)
          .set('Authorization', userToken)
          .send(data)
          .then(res => {
            expect(res.statusCode).to.equal(422);
            expect(res.body).to.have.property('message');
            expect(res.body.message.msg).to.equal('Post cant be updated now');
            done();
          });
      });
    });
  });

  it('Success: logs out a user', done => {
    chai
      .request(apiBase)
      .delete('/api/logout')
      .set('Authorization', userToken)
      .then(res => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('status').to.equal('User loggedout successfully');
        done();
      });
  });
});
