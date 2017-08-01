'use strict'

const co = require('bluebird-co').co

require('marko/node-require')
require('marko/compiler').defaultOptions.writeToDisk = false

const path = require('path')
const debug = require('debug')('hapi-form-authentication:plugin')

const _options = require(path.join(__dirname, 'lib', 'options.js'))

let pluginOptions

const internals = {}

const plugin = function (server, options, next) {
  co(function *() {
    pluginOptions = _options(server, options)
    debug('plugin registered')
    debug('pluginOptions: %j', pluginOptions)
    server.ext('onRequest', function (request, reply) {
      debug('received request for %s [%s]', request.path, request.method)
      reply.continue()
    })
    server.auth.scheme('form', internals.scheme)
    if (!server.registrations['yar']) {
      yield server.register({
        register: require('yar'),
        options: pluginOptions.yar
      })
    }
    server.route({
      method: 'post',
      path: pluginOptions.postPath,
      handler: function (request, reply) {
        debug('destination: %s', request.yar.get('destination'))
        const username = request.payload.username
        const password = request.payload.password
        debug('username: %s, password: %s', username, password)
        options.handler(username, password, function (isValid, credentials) {
          if (isValid) {
            debug('credentials for %s are valid', username)
            request.yar.set(pluginOptions.credentialsName, credentials)
            return reply.redirect(request.yar.get('destination') || pluginOptions.loginSuccessRedirectPath || pluginOptions.redirectPath)
          } else {
            debug('credentials for %s are not valid', username)
            return reply(pluginOptions.loginPageFunction({
              postPath: pluginOptions.postPath,
              success: false
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
    .catch((err) => {
      throw err
    })
}

plugin.attributes = {
  pkg: require('./package.json')
}

internals.scheme = function () {
  const _scheme = {}
  _scheme.authenticate = function (request, reply) {
    debug('_scheme.authenticate called')
    if (!request.yar.get('destination')) {
      debug('destination is not set, setting to request.path')
      request.yar.set('destination', request.path)
    }
    debug('destination: %s', request.yar.get('destination'))
    const credentials = request.yar.get(pluginOptions.credentialsName)
    if (credentials) {
      debug('credentials does exist')
      reply.continue({credentials})
    } else {
      debug('credentials does not exist')
      reply(null, null, {})
        .redirect(pluginOptions.loginPath)
    }
  }
  return _scheme
}

module.exports = plugin
