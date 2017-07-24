'use strict'

const chai = require('chai')

chai.should()

const path = require('path')
const Hapi = require('hapi')
const request = require('request')

let server

const plugin = require(path.join(__dirname, '..', 'index.js'))

const url = 'http://localhost:9999/secure'
const method = 'get'

describe('integration testing', function () {

  //
  beforeEach(function (done) {
    server = new Hapi.Server()
    server.connection({
      host: 'localhost',
      port: 9999
    })
    done()
  })
  afterEach(function (done) {
    server.stop({timeout: 5000}, function (err) {
      if (err) {
        console.error(err.message)
      }
      server = undefined
      done()
    })
  })
  //

  it('secure endpoint should redirect to default login form when not logged in', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (username, password, callback) {
            const isValid = password === 'password'
            callback(isValid, {username: username})
          }
        }
      },
      function (err) {
        if (err) throw err
        server.auth.strategy('arbitraryString', 'form')
        server.route({
          method,
          path: '/secure',
          config: {
            auth: 'arbitraryString'
          },
          handler: function (request, reply) {
            return reply('secure')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method, followRedirect: false},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(302)
              httpResponse.headers.location.should.equal('/login')
              done()
            }
          )
        })
      })
  })

  it('secure endpoint should redirect to custom path login form when not logged in', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (username, password, callback) {
            const isValid = password === 'password'
            callback(isValid, {username: username})
          },
          formPath: '/pizza'
        }
      },
      function (err) {
        if (err) throw err
        server.auth.strategy('arbitraryString', 'form')
        server.route({
          method,
          path: '/secure',
          config: {
            auth: 'arbitraryString'
          },
          handler: function (request, reply) {
            return reply('secure')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method, followRedirect: false},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(302)
              httpResponse.headers.location.should.equal('/pizza')
              done()
            }
          )
        })
      })
  })

  it('attempting to log in with blank username and password should return 401', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (username, password, callback) {
            const isValid = password === 'password'
            callback(isValid, {username: username})
          }
        }
      },
      function (err) {
        if (err) throw err
        server.auth.strategy('arbitraryString', 'form')
        server.route({
          method,
          path: '/secure',
          config: {
            auth: 'arbitraryString'
          },
          handler: function (request, reply) {
            return reply('secure')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request(
            {
              url: 'http://localhost:9999/login',
              method: 'post',
              followRedirect: false,
              formData: {
                username: ''
              }
            },
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(401)
              done()
            }
          )
        })
      })
  })

  it('attempting to log in with good credentials should return 302 with location header set to /', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (username, password, callback) {
            const isValid = password === 'password'
            callback(isValid, {username: username})
          }
        }
      },
      function (err) {
        if (err) throw err
        server.auth.strategy('arbitraryString', 'form')
        server.route({
          method,
          path: '/secure',
          config: {
            auth: 'arbitraryString'
          },
          handler: function (request, reply) {
            return reply('secure')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request(
            {
              url: 'http://localhost:9999/login',
              method: 'post',
              followRedirect: false,
              formData: {
                username: 'cread',
                password: 'password'
              }
            },
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(302)
              httpResponse.headers.location.should.equal('/')
              done()
            }
          )
        })
      })
  })

  it('attempting to log in with good credentials redirect to /', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (username, password, callback) {
            const isValid = password === 'password'
            callback(isValid, {username: username})
          }
        }
      },
      function (err) {
        if (err) throw err
        server.auth.strategy('arbitraryString', 'form')
        server.route({
          method: 'get',
          path: '/',
          handler: function (request, reply) {
            return reply('/')
          }
        })
        server.route({
          method,
          path: '/secure',
          config: {
            auth: 'arbitraryString'
          },
          handler: function (request, reply) {
            return reply('secure')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request(
            {
              url: 'http://localhost:9999/login',
              method: 'post',
              followAllRedirects: true,
              formData: {
                username: 'cread',
                password: 'password'
              }
            },
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(200)
              body.should.equal('/')
              done()
            })
        })
      })
  })

})