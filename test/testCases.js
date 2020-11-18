/* eslint-disable no-loop-func */
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

describe('# Project APIs', () => {
  let adminToken;
  const username = faker.name.findName();
  const email = faker.internet.email();
  const password = 'User@123abc';

  describe('logs in admin', () => {
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
});
