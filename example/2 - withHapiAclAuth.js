'use strict'

const path = require('path')
const Hapi = require('hapi')

const plugin = require(path.join(__dirname, '..', 'index.js'))

const db = {
  'cread': {
    name: 'Charles Read',
    password: 'cricket',
    roles: ['SUPERUSER']
  },
  'lread': {
    name: 'Ladybug Read',
    password: 'treats',
    roles: ['ADMIN']
  },
  'jsmith1': {
    name: 'John Smith',
    password: 'passw0rd',
    roles: ['USER']
  }
}

const plugins = [
  {
    register: plugin,
    options: {
      handler: function (username, password, callback) {
        // in practice you'd have a significantly more robust process here
        const user = db[username]
        if (!user) {
          return callback(false)
        }
        if (user.password === password) {
          return callback(true, {username, name: user.name, roles: user.roles})
        } else {
          return callback(false)
        }
      }
    }
  },
  {
    register: require('hapi-acl-auth'),
    options: {
      handler: function (request, callback) {
        callback(null, request.auth.credentials)
      },
      hierarchy: ['USER', 'ADMIN', 'SUPERUSER'],
      policy: 'allow'
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
  server.auth.strategy('hfa', 'form')
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
      auth: 'hfa',
      plugins: {
        hapiAclAuth: {
          roles: ['ADMIN'],
          secure: true
        }
      }
    }
  })
})

server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
