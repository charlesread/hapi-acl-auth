[![Build Status](https://travis-ci.org/charlesread/hapi-acl-auth.svg?branch=master)](https://travis-ci.org/charlesread/hapi-acl-auth)

# hapi-acl-auth

I didn't like how tightly coupled other `hapi` ACL authorization plugins were to authentication mechanisms, so I wrote my own that doesn't care what authentication mechanism that you use.

Basically you just tell the plugin what roles a user has, what roles an endpoint allows (or every endpoint, by specifying the roles in the plugin config as opposed to each route), and you're set.

## Installation

```bash
npm i -S hapi-acl-auth
```

## Utilization

```js
'use strict'

const Hapi = require('hapi')

const server = new Hapi.Server()
server.connection({
  host: 'localhost',
  port: 8000
})

const plugins = [
  {
    register: require('hapi-acl-auth'),
    options: {
      handler: function (request, callback) {
        // callback(err, obj) takes an error object and an arbitrary object, although
        // this object must contain an array of roles possessed by the user
        callback(null, {username: 'cread', roles: ['SUPERUSER']})
      }
    }
  }
]

server.register(
  plugins,
  function (err) {
    if (err) {
      throw err
    }
    server.route({
      method: 'GET',
      path: '/protected',
      config: {
        plugins: {
          hapiAclAuth: {
            roles: ['ADMIN', 'SUPERUSER']
          }
        }
      },
      handler: function (request, reply) {
        return reply('protected')
      }
    })

    server.route({
      method: 'GET',
      path: '/notprotected',
      handler: function (request, reply) {
        return reply('notprotected')
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

Most options can be specified at the plugin level, or for each individual route.  In other words, you can "lock down" every route all at once, or at each route, or both (with route config overriding plugin config).

* `handler` - _mandatory_, a `function` with signature `function(err, object)`.  The `object` can be arbitrary, but it must contain a `roles` attribute that is an `Array` of roles that are allowed for the route (or routes, if configured in the plugin options).
* `any` - _optional_, a `Boolean`, `true` by default, that specifies whether a user may possess _any_ of the allowed roles in order to be authorized.
* `all` - _optional_, a `Boolean`, `false` by default, that specifies whether a user _must_ possess _all_ of the allowed routes in order to be authorized.
* `hierarchy` - _optional_, an `Array` that specifies the privilege hierarchy of roles in order of ascending privilege.  For instance, suppose we have  `hierarchy: ['user', 'admin', 'superuser]` configured for a route and `roles: ['admin']` configured for that same route.  A user with the `SUPERUSER` role will be able to access that route because the `SUPERUSER` role is of higher privilege than the `ADMIN` role, as specified in the hierarchy.
* `forbiddenPagePath` - _optional_, a `string`,`../static/403.html` by default, that specifies the path to the page you'd like rendered when a user is not authorized.  *NOTE*: this path is passed directly to `fs.createReadStream`
* `forbiddenPageFunction` - _optional_, a `function` with signature `function(object)` (*NOTE*: the `object` argument here is the _same_ as the object in `handler(err, object)`), that returns the content to be rendered to the browser when a user is not authorized.  That which this function returns is passed to [hapi's reply](https://hapijs.com/api#reply-interface) interface, so it can be lots of things, like a `Stream` or a `string`.