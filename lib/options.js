'use strict'

const path = require('path')
const deepExtend = require('deep-extend')
const randomize = require('randomatic')

module.exports = function (server, options) {
  const defaultOptions = {
    postPath: '/login',
    loginPath: '/login',
    logoutPath: '/logout',
    redirectPath: '/',
    loginPageFunction: function (data) {
      const page = require(path.join(__dirname, '..', 'static', 'login.marko'))
      return page.stream(data)
    },
    yar: {
      storeBlank: false,
      cookieOptions: {
        password: randomize('*', 256),
        isSecure: server.info.protocol === 'https',
        isHttpOnly: true,
        isSameSite: 'Strict'
      }
    }
  }
  return deepExtend({}, defaultOptions, options)
}