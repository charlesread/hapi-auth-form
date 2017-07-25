[![Build Status](https://travis-ci.org/charlesread/hapi-form-authentication.svg?branch=master)](https://travis-ci.org/charlesread/hapi-form-authentication)
# hapi-form-authentication

<!-- toc -->

- [Installation](#installation)
- [Utilization](#utilization)
- [Configuration Options](#configuration-options)
  * [Plugin-centric options](#plugin-centric-options)
  * [Additional Options](#additional-options)

<!-- tocstop -->

There are a _ton_ of great authentication plugins for `hapi` out there, this is just another one, and it provides simple `<form>`-based authentication.

Cool stuff that `hapi-form-authentication` gives you:

* A simple plug-and-play authentication mechanism in only a few lines of code.
* Custom login and logout pages

Check out the [example](https://github.com/charlesread/hapi-form-authentication/tree/master/example) directory for examples!

## Installation

```bash
npm i -S hapi-form-authentication
```

## Utilization

```js
'use strict'

const Hapi = require('hapi')

const plugins = [
  {
    register: require('hapi-form-authentication'),
    options: {
      handler: function (username, password, callback) {
        // if the password is "password" let them in
        const isValid = password === 'password'
        // the callback takes two parameters; the first is a simple Boolean
        // that indicates whether or not the user is valid, the second is an
        // object that must contain, at a minimum, a `username` attribute,
        // this object will accessible as `request.auth.credentials` in routes
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
})

server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})

```

## Configuration Options

### Plugin-centric options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| handler (required) | `function` |  | a `function` with signature `function(isValid, object)`. `isValid` should be a `Boolean` that indicates whether or not the user is valid, i.e. if their credentials are correct.  The `object` can be arbitrary, but it must contain a `username` attribute, it will be accessible via `request.auth.credentials` in routes. The `handler` function is where you will perform whatever logic you like to verify the authenticity of the credentials. |
| loginPath | `string` | "/login" | This is the path of the login form, like where users will log in, `http://example.com/login`, for example. `hapi-form-authentication` creates this route for you, you can just tell it what you want it named.|
| postPath | `string` | "/login" | This is the path that the login form will actually `POST` to. `hapi-form-authentication` creates this route for you, you can just tell it what you want it named. |
| logoutPath | `string` | "/logout" | This is the path where users can logout, `http://example.com/logout`, for example, this route kills the users session. `hapi-form-authentication` creates this route for you, you can just tell it what you want it named. |
| redirectPath | `string` | "/"| If a user attempts to access a secure route they will be redirected to `loginPath`, upon successful authentication they will redirected back to the originally requested route.  But what if they access `loginPath` directly?  It wouldn't make much sense for them to be redirect _back_ to the login page now would it? To where will they be redirected upon successful authentication?  If you guessed `redirectPath` you're right! |
| loginPageFunction | `function` | | Don't like the default login page/form? No worries, you can edit it here.  `loginPageFunction` should return the page that you'd like rendered at `loginPath`.  That which this function returns is passed to [hapi's reply interface](https://hapijs.com/api#reply-interface), so it can be lots of things, like a `Stream` or a `string`.  The function has the signature `function(object)`, where `object` is an object that contains the value of `postPath`, so that you can dynamically determine where your `<form>` should post to. |
| logoutPageFunction | `function` | | `logoutPageFunction` should return the page that you'd like rendered at `loginPath`.  That which this function returns is passed to [hapi's reply interface](https://hapijs.com/api#reply-interface), so it can be lots of things, like a `Stream` or a `string`.  By default, logging out will just redirect the user back to `loginPath`. |

### Additional Options

`hapi-form-authentication` makes use of sessions and cookies, it uses [yar](https://www.npmjs.com/package/yar) to do so.  You can override the default `yar` options with the `yar` attribute.  `hapi-form-authentication` uses a fairly secure `yar` configuration, so you should be careful in tinkering with these options as they may have a drastic impact on the security of your site.  <strong style="color:red">You have been warned.</strong>

Of particular importance is the `yar.cookieOptions.isSecure` attribute.  When set to `true` cookies <strong>will only be sent if the connection uses https</strong>.  This is a good thing.  This should be `true` in production environments.  By default `hapi-form-authentication` uses `server.info.protocol` to determine if your application is serving over https and will set `yar.cookieOptions.isSecure` appropriately.  For reference, the default options are below.

```js
yar: {
  storeBlank: false,
  cookieOptions: {
    password: randomize('*', 256), // https://www.npmjs.com/package/randomatic
    isSecure: server.info.protocol === 'https',
    isHttpOnly: true,
    isSameSite: 'Strict'
  }
}
```