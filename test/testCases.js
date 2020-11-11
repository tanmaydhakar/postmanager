const chai = require('chai');
const faker = require('faker');
const { expect } = require('chai');
const chaiHttp = require('chai-http');

const apiBase = 'http://localhost:5002';
chai.use(chaiHttp);

describe('# Project APIs', () => {
  let adminToken;
  let userToken;
  let createPostResponse;

  const todayDate = new Date();
  const tomorrowDate = new Date(todayDate.setDate(todayDate.getDate() + 1));
  const yesterdayDate = new Date(todayDate.setDate(todayDate.getDate() - 1));
  const username = faker.name.findName() + 1;
  const email = faker.internet.email();
  const password = 'User@123abc';

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

  const createPost = function () {
    const data = {
      scheduled_date: tomorrowDate,
      message: faker.random.words({ count: 10 })
    };
    return new Promise(resolve => {
      chai
        .request(apiBase)
        .post('/api/post')
        .set('Authorization', userToken)
        .send(data)
        .then(res => {
          return resolve(res.body);
        });
    });
  };

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

  createPost().then(result => {
    it('Fail: user tries to reject a post', done => {
      createPostResponse = result;
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
        expect(res.body.post).to.have.property('status').to.equal('Scheduled');
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

  createPost().then(result => {
    it('Success: rejects a post', done => {
      createPostResponse = result;
      chai
        .request(apiBase)
        .patch(`/api/post/${createPostResponse.post.id}/reject`)
        .set('Authorization', adminToken)
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.have.property('post');
          expect(res.body.post).to.have.property('id').to.equal(createPostResponse.post.id);
          expect(res.body.post).to.have.property('status').to.equal('Rejected');
          done();
        });
    });
  });

  it('Fail: delete a rejected post', done => {
    chai
      .request(apiBase)
      .delete(`/api/post/${createPostResponse.post.id}`)
      .set('Authorization', userToken)
      .then(res => {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.message.msg).to.equal('Post cant be updated now');
        done();
      });
  });

  createPost().then(result => {
    it('Success: delete a post', done => {
      createPostResponse = result;
      chai
        .request(apiBase)
        .delete(`/api/post/${createPostResponse.post.id}`)
        .set('Authorization', userToken)
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.have.property('status').to.equal('Post deleted successfully');
          done();
        });
    });
  });
});
