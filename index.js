'use strict'

require('marko/node-require')
require('marko/compiler').defaultOptions.writeToDisk = false

const path = require('path')
const deepExtend = require('deep-extend')
const debug = require('debug')('hapi-form-authentication:plugin')
const randomize = require('randomatic')
const Joi = require('joi')

function processOptions(server, options) {
  const defaultOptions = {
    postPath: '/login',
    loginPath: '/login',
    logoutPath: '/logout',
    redirectPath: '/',
    loginPageFunction: function (data) {
      const page = require(path.join(__dirname, 'static', 'login.marko'))
      return page.stream(data)
    },
    yar: {
      storeBlank: false,
      cookieOptions: {
        password: randomize('*', 256),
        isSecure: server.info.protocol === 'https',
        isHttpOnly: true
        // ,
        // isSameSite: 'Strict'
      }
    }
  }
  return deepExtend({}, defaultOptions, options)
}

let pluginOptions

const internals = {}

const plugin = function (server, options, next) {
  pluginOptions = processOptions(server, options)
  debug('plugin registered')
  debug('pluginOptions: %j', pluginOptions)
  // server.ext('onRequest', function (request, reply) {
  //   debug('received request for %s [%s]', request.path, request.method)
  //   reply.continue()
  // })
  server.auth.scheme('form', internals.scheme)
  server.register({
    register: require('yar'),
    options: pluginOptions.yar
  }, function (err) {
    if (err) {
      throw err
    }
    server.route({
      method: 'post',
      path: pluginOptions.postPath,
      handler: function (request, reply) {
        debug('destination: %s', request.yar.get('destination'))
        const username = request.payload.username
        const password = request.payload.password
        debug('username: %s, password: %s', username, password)
        if (!username || !password) {
          return reply(pluginOptions.loginPageFunction({
            isAuthenticated: false,
            failure: true
          })).code(401)
        }
        options.handler(username, password, function (isValid, credentials) {
          if (isValid) {
            debug('credentials for %s are valid', username)
            request.yar.set('credentials', credentials)
            return reply.redirect(request.yar.get('destination') || pluginOptions.redirectPath)
          } else {
            debug('credentials for %s are not valid', username)
            return reply(pluginOptions.loginPageFunction({
              isAuthenticated: isValid,
              failure: true
            })).code(401)
          }
        })
      }
    })
    server.route({
      method: 'get',
      path: pluginOptions.loginPath,
      handler: function (request, reply) {
        return reply(pluginOptions.loginPageFunction({postPath: pluginOptions.postPath}))
      }
    })
    server.route({
      method: 'get',
      path: pluginOptions.logoutPath,
      handler: function (request, reply) {
        request.auth.isAuthenticated = false
        request.auth.credentials = null
        request.yar.reset()
        return pluginOptions.logoutPageFunction ? reply(pluginOptions.logoutPageFunction()) : reply.redirect(pluginOptions.loginPath)
      }
    })
    next()
  })
}

plugin.attributes = {
  pkg: require('./package.json')
}

internals.scheme = function () {
  const _scheme = {}
  _scheme.authenticate = function (request, reply) {
    console.log(request.auth)
    debug('_scheme.authenticate called')
    if (!request.yar.get('destination')) {
      debug('destination is not set, setting to request.path')
      request.yar.set('destination', request.path)
    }
    debug('destination: %s', request.yar.get('destination'))
    let credentials = request.auth.credentials
    if (!credentials) {
      debug('credentials not found in request.auth.credentials, checking yar')
      credentials = request.yar.get('credentials')
    }
    if (credentials) {
      debug('credentials does exist')
      reply.continue({credentials})
      debug('request.auth.credentials:')
      debug(request.auth.credentials)
      if (request.path === request.yar.get('destination')) {
        debug('request.path matches destination')
        // request.yar.clear('credentials')
      }
    } else {
      debug('credentials does not exist')
      reply(null, null, {})
        .redirect(pluginOptions.loginPath)
    }
  }
  return _scheme
}

module.exports = plugin
