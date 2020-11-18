/* eslint-disable no-loop-func */
const chai = require('chai');
const faker = require('faker');
const { expect } = require('chai');
const chaiHttp = require('chai-http');
const path = require('path');

const app = require(path.resolve('./index'));
const db = require(path.resolve('./models'));
const { Post, Scheduled_post } = db;

const apiBase = 'http://localhost:5002';
chai.use(chaiHttp);

const errorCasesGenerator = function (cases, api) {
  for (let i = 0; i <= cases.length - 1; i += 1) {
    it(cases[i].description, done => {
      chai
        .request(apiBase)
        .post(api)
        .send(cases[i].data)
        .then(res => {
          expect(res.statusCode).to.equal(422);
          expect(res.body).to.have.property('message');
          expect(res.body.message.msg).to.equal(cases[i].msg);
          done();
        });
    });
  }
};

const registerUser = function () {
  return new Promise(resolve => {
    const username = faker.name.findName();
    const email = faker.internet.email();
    const password = 'User@123abc';

    chai
      .request(apiBase)
      .post('/api/register')
      .send({ username, email, password })
      .then(res => {
        return resolve(res.body.user);
      });
  });
};

const loginUser = function (username, password) {
  return new Promise(resolve => {
    chai
      .request(apiBase)
      .post('/api/login')
      .send({ username, password })
      .then(res => {
        return resolve(res.body.user);
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

describe('# Project APIs', () => {
  let adminToken;
  const username = faker.name.findName();
  const email = faker.internet.email();
  const password = 'User@123abc';
  const todayDate = new Date();
  const tomorrowDate = new Date(todayDate.setDate(todayDate.getDate() + 1));
  const yesterdayDate = new Date(todayDate.setDate(todayDate.getDate() - 1));

  before(function (done) {
    chai
      .request(apiBase)
      .post('/api/login')
      .send({ username: 'Admin123', password: 'Admin@123' })
      .then(res => {
        adminToken = res.body.user.token;
        done();
      });
  });

  describe('registers user fail cases', () => {
    const cases = [
      {
        description: 'Fail: registers a user without username',
        msg: 'username does not exists',
        data: { password, email }
      },
      {
        description: 'Fail: registers a user without email',
        msg: 'email does not exists',
        data: { password, username }
      },
      {
        description: 'Fail: registers a user without password',
        msg: 'password does not exists',
        data: { email, username }
      },
      {
        description: 'Fail: registers a user with non string password',
        msg: 'password must be string',
        data: { email, username, password: 123 }
      },
      {
        description: 'Fail: registers a user with non 6 character password',
        msg: 'password should be minimum 6 characters',
        data: { email, username, password: 'abc1' }
      },
      {
        description: 'Fail: registers a user without small case in password',
        msg: 'Password should contain atleast one capital letter',
        data: { email, username, password: 'onlylowercase' }
      },
      {
        description: 'Fail: registers a user without upper case in password',
        msg: 'Password should contain atleast one small letter',
        data: { email, username, password: 'ONLYUPPERCASE' }
      },
      {
        description: 'Fail: registers a user without special charater in password',
        msg: 'Password should contain atleast one special character',
        data: { email, username, password: 'Abc123abc' }
      },
      {
        description: 'Fail: registers a user with invalid email',
        msg: 'Invalid email format',
        data: { password, email: username, username }
      },
      {
        description: 'Fail: registers a user without string username',
        msg: 'username must be string',
        data: { username: 123, password, email }
      },
      {
        description: 'Fail: registers a user with less than 5 letter username',
        msg: 'username should be minimum 5 characters',
        data: { username: 'abcd', password, email }
      }
    ];

    errorCasesGenerator(cases, '/api/register');
  });

  describe('Success register', () => {
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

    const cases = [
      {
        description: 'Fail: registers a user with already taken username',
        msg: 'username already exists',
        data: { username, password, email }
      },
      {
        description: 'Fail: registers a user with already taken email',
        msg: 'Email already exists',
        data: { username: username + 1, password, email }
      }
    ];

    errorCasesGenerator(cases, '/api/register');
  });

  describe('Fail login', () => {
    const cases = [
      {
        description: 'Fail: log in a user without username',
        msg: 'username does not exists',
        data: { password }
      },
      {
        description: 'Fail: log in a user without password',
        msg: 'password does not exists',
        data: { username }
      },
      {
        description: 'Fail: log in a user with empty password',
        msg: 'password should not be empty',
        data: { password: '', username }
      },
      {
        description: 'Fail: log in a user with invalid username',
        msg: 'username is invalid',
        data: { username: username + 1, password }
      }
    ];

    errorCasesGenerator(cases, '/api/login');

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
  });

  describe('login without auth token', () => {
    const userToken = faker.random.words(10);

    it('Fail: request without auth token', done => {
      chai
        .request(apiBase)
        .get('/api/posts')
        .then(res => {
          expect(res.statusCode).to.equal(404);
          expect(res.body)
            .to.have.property('message')
            .to.equal('Authorization header not provided');
          done();
        });
    });

    it('Fail: request with invalid auth token', done => {
      chai
        .request(apiBase)
        .get('/api/posts')
        .set('Authorization', userToken)
        .then(res => {
          expect(res.statusCode).to.equal(401);
          expect(res.body).to.have.property('message').to.equal('Failed to authorize token');
          done();
        });
    });
  });

  describe('Post apis testing', () => {
    let userToken;
    before(function (done) {
      registerUser().then(registeredUser => {
        loginUser(registeredUser.username, password).then(user => {
          userToken = user.token;
          done();
        });
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
  });

  describe('create post error', () => {
    let userToken;
    let postResponse;
    before(function (done) {
      const registerUserPromise = registerUser;
      registerUserPromise().then(registeredUser => {
        const loginUserPromise = loginUser;
        loginUserPromise(registeredUser.username, password).then(user => {
          userToken = user.token;
          done();
        });
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
          postResponse = res.body;
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
        .get(`/api/post/${postResponse.post.id}`)
        .set('Authorization', userToken)
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.have.property('post');
          expect(res.body).to.deep.equal(postResponse);

          done();
        });
    });

    describe('Fail: gets a specific post that does not belongs to that user', () => {
      before(function (done) {
        const registerUserPromise = registerUser;
        registerUserPromise().then(registeredUser => {
          const loginUserPromise = loginUser;
          loginUserPromise(registeredUser.username, password).then(user => {
            userToken = user.token;
            done();
          });
        });
      });

      it('Fail: gets a specific post that does not belongs to that user', done => {
        chai
          .request(apiBase)
          .get(`/api/post/${postResponse.post.id}`)
          .set('Authorization', userToken)
          .then(res => {
            expect(res.statusCode).to.equal(401);
            expect(res.body)
              .to.have.property('message')
              .to.equal('User unauthorized to access this resource');

            done();
          });
      });
    });

    describe('check admin apis', () => {
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
          .patch(`/api/post/${postResponse.post.id}/approve`)
          .set('Authorization', adminToken)
          .then(res => {
            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('post');
            expect(res.body.post).to.have.property('id').to.equal(postResponse.post.id);
            expect(res.body.post).to.have.property('status').to.equal('Scheduled');
            done();
          });
      });

      it('Fail: approve a already approved post', done => {
        chai
          .request(apiBase)
          .patch(`/api/post/${postResponse.post.id}/approve`)
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
          .patch(`/api/post/${postResponse.post.id}/reject`)
          .set('Authorization', adminToken)
          .then(res => {
            expect(res.statusCode).to.equal(422);
            expect(res.body).to.have.property('message');
            expect(res.body.message.msg).to.equal('Post cant be updated now');
            done();
          });
      });

      it('Fail: user tries to reject a post', done => {
        chai
          .request(apiBase)
          .patch(`/api/post/${postResponse.post.id}/reject`)
          .set('Authorization', userToken)
          .then(res => {
            expect(res.statusCode).to.equal(403);
            expect(res.body).to.have.property('message');
            expect(res.body.message).to.equal('You cant access this resource');
            done();
          });
      });

      it('Fail: user tries to approve a post', done => {
        chai
          .request(apiBase)
          .patch(`/api/post/${postResponse.post.id}/approve`)
          .set('Authorization', userToken)
          .then(res => {
            expect(res.statusCode).to.equal(403);
            expect(res.body).to.have.property('message');
            expect(res.body.message).to.equal('You cant access this resource');
            done();
          });
      });
    });
  });

  describe('checking update post apis', () => {
    let postResponse;
    before(done => {
      const registerUserPromise = registerUser;
      registerUserPromise().then(registeredUser => {
        const loginUserPromise = loginUser;
        loginUserPromise(registeredUser.username, password).then(user => {
          userToken = user.token;
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
              postResponse = res.body;
              done();
            });
        });
      });
    });

    it('Fail: update a post with invalid scheduled_date', done => {
      const data = {
        scheduled_date: yesterdayDate,
        message: faker.random.words({ count: 10 })
      };
      chai
        .request(apiBase)
        .patch(`/api/post/${postResponse.post.id}`)
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
      chai
        .request(apiBase)
        .patch(`/api/post/${postResponse.post.id}/reject`)
        .set('Authorization', adminToken)
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.have.property('post');
          expect(res.body.post).to.have.property('id').to.equal(postResponse.post.id);
          expect(res.body.post).to.have.property('status').to.equal('Rejected');
          rejectPostResponse = res.body;
          done();
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
      updatePostStatus(postResponse.post.id, 'Scheduled').then(post => {
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

    describe('update post after status change', () => {
      before(done => {
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
            postResponse = res.body;
            done();
          });
      });

      it('Success: update post after its scheduled', done => {
        updatePostStatus(postResponse.post.id, 'Scheduled').then(post => {
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

    describe('update post after its posted', () => {
      before(done => {
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
            postResponse = res.body;
            done();
          });
      });

      it('Fail: update post after its posted', done => {
        updatePostStatus(postResponse.post.id, 'Posted').then(post => {
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
  });

  describe('logout user', () => {
    let userToken;
    before(done => {
      const registerUserPromise = registerUser;
      registerUserPromise().then(registeredUser => {
        const loginUserPromise = loginUser;
        loginUserPromise(registeredUser.username, password).then(user => {
          userToken = user.token;
          done();
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
});
