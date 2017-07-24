'use strict'

const path = require('path')
const Hapi = require('hapi')

const plugin = require(path.join(__dirname, '..', 'index.js'))

const plugins = [
  {
    register: plugin,
    options: {
      handler: function (username, password, callback) {
        const isValid = password === 'p'
        callback(isValid, {username: username})
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
  server.route({
    method: 'get',
    path: '/',
    handler: function (request, reply) {
      return reply('/')
    }
  })
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
})

server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
