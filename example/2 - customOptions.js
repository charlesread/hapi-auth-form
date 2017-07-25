'use strict'

const path = require('path')
const Hapi = require('hapi')

const plugin = require(path.join(__dirname, '..', 'index.js'))

const plugins = [
  {
    register: plugin,
    options: {
      handler: function (username, password, callback) {
        // if the password is "password" let them in
        const isValid = password === 'password'
        callback(isValid, {username: username})
      },
      loginPath: '/pizza',
      postPath: '/breadsticks',
      redirectPath: '/ribeye',
      logoutPath: '/bye',
      logoutPageFunction: function () {
        return '<h1>you are logged out, bye</h1>'
      },
      yar: {
        cookieOptions: {
          // cookie expires in 10 seconds, i.e. the user will be logged out in 10 seconds
          ttl: 10000
        }
      }
    }
  }
]

const server = new Hapi.Server()

server.connection({
  host: 'localhost',
  port: 8000
})

server.register(plugins, function (err) {
  if (err) {
    throw err
  }
  // the first argument can really be anything, it's just an identifier that
  // is to be used in a route's config.auth attribute, as shown below
  server.auth.strategy('arbitraryString', 'form')
  // an insecure route
  server.route({
    method: 'get',
    path: '/',
    handler: function (request, reply) {
      return reply('/')
    }
  })
  // a secure route
  server.route({
    method: 'get',
    path: '/secure',
    handler: function (request, reply) {
      return reply('secure, username: ' + request.auth.credentials.username)
    },
    config: {
      auth: 'arbitraryString'
    }
  })
  // a secure route
  server.route({
    method: 'get',
    path: '/ribeye',
    handler: function (request, reply) {
      return reply('medium rare, duh')
    },
    config: {
      auth: 'arbitraryString'
    }
  })
})

server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
