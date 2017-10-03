[![Build Status](https://travis-ci.org/charlesread/hapi-acl-auth.svg?branch=master)](https://travis-ci.org/charlesread/hapi-acl-auth)
[![Coverage Status](https://coveralls.io/repos/github/charlesread/hapi-acl-auth/badge.svg?branch=master)](https://coveralls.io/github/charlesread/hapi-acl-auth?branch=master)

# hapi-acl-auth

I didn't like how tightly coupled other `hapi` ACL authorization plugins were to authentication mechanisms, so I wrote my own that doesn't care what authentication mechanism that you use, or even if you use an authentication mechanism at all (although that would be a bit dumb).

Basically you just tell the plugin what roles a user has, what roles an endpoint allows, and you're set.

Cool stuff that `hapi-acl-auth` gives you:

* The ability to lock down the entire application, or just a few routes
* Typical any/all functionality (allow if user has _any_ of these roles, allow if users has _all_ of these roles, for example)
* Specifying a hierarchy of roles ("admins" are clearly "users" too, so let them through without explicitly letting "admins" through, for example)
* The ability to have custom forbidden pages
* Caching of roles for performance
* [And so much more!](https://www.google.com/search?q=but+wait+there%27s+more&tbm=isch&tbo=u&source=univ&sa=X&ved=0ahUKEwiBjtj4tJvVAhXEPD4KHbPyCN4QsAQIJw&biw=1440&bih=776)

Check out the [example](https://github.com/charlesread/hapi-acl-auth/tree/master/example) directory for examples!

<!-- toc -->

- [Installation](#installation)
- [Utilization](#utilization)
- [Taglib](#taglib)
- [Plugin/Route Configuration Options](#pluginroute-configuration-options)
  * [Plugin _and_ route options](#plugin-_and_-route-options)
  * [Plugin _only_ options](#plugin-_only_-options)
  * [Route _only_ options](#route-_only_-options)

<!-- tocstop -->

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
        // this object must contain a `roles` attribute that contains an array of
        // roles, or a function that returns an array of roles or returns a promise
        // that resolves an array of roles, that are possessed by the user
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

## Taglib

If you're using Marko the [hapi-acl-auth-taglib](https://www.npmjs.com/package/hapi-acl-auth-taglib) can be for several tasks, including displaying or not displaying content in Marko templates.

## Plugin/Route Configuration Options

Most options can be specified at the plugin level, or for each individual route.  In other words, you can "lock down" every route all at once, or at each route, or both (with route config overriding plugin config).

### Plugin _and_ route options

| Name | Type | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| handler (required) | `function` |  |  | a `function` with signature `function(err, object)`.  The `object` can be arbitrary, but it must contain a `roles` attribute that is an `Array` (or a `function` that returns an array) of roles that are allowed for the route (or routes, if configured in the plugin options). |
| roles (required) | `Array`&#124;`function` |  |  | an `Array` of roles (or a `function` that returns an array of roles or returns a `Promise` that resolves an array of roles) that are allowed for the route or routes.  *NOTE*: this attribute can be set at the plugin or route level, if it is set at the plugin level it will apply to _all_ routes, if set on an individual route it only applies to that route, but you can set a "policy" at the plugin level and then override it in individual routes should you so desire. |
| any | `Boolean` | `true` | `true`&#124;`false` | specifies whether a user may possess _any_ of the allowed roles in order to be authorized. |
| all | `Boolean` | `false` | `true`&#124;`false` | specifies whether a user _must_ possess _all_ of the allowed routes in order to be authorized. |
| hierarchy | `Array` |  |  | an `Array` that specifies the privilege hierarchy of roles in order of ascending privilege.  For instance, suppose we have  `hierarchy: ['user', 'admin', 'superuser]` configured for a route and `roles: ['admin']` configured for that same route.  A user with the `superuser` role will be able to access that route because the `superuser` role is of higher privilege than the `admin` role, as specified in the hierarchy. |
| forbiddenPageFunction | `function` |  |  | a `function` with signature `function(object[, request, reply])` (*NOTE*: the `object` argument here is the _same_ as the object in `handler(err, object)`), that returns the content to be rendered to the browser when a user is not authorized.  This function can work in one of two ways: 1) when this function is passed only one argument that which this function returns is passed _directly_ to [hapi's reply interface](https://hapijs.com/api#reply-interface), so it can be lots of things, like a `Stream` or a `string`, 2) if this function is passed more than one argument (i.e. the `object`, `request`, and `reply` objects) `hapi-acl-auth` will basically do nothing, your function will still be called, but it is then _up to you_ to `reply`, this is useful if you want to `reply` in a fancier fashion, like with a view or a non-200 status code.|
| cache | `Boolean` | `false` | `true`&#124;`false` | if caching is enabled the `roles` arrays will be cached, this is helpful if you use resource intensive functions to return roles in the `handler` function or the `roles` attribute |
| allowUnauthenticated | `Boolean` | `false` | `true`&#124;`false` | `hapi-acl-auth` makes use of the `onPostAuth` extension point, basically it does its processing to determine whether or not a user should have access before Hapi responds to a request. If you're using an authentication plugin for Hapi, or anything else really, that performs a redirect in order to authenticate, `hapi-acl-auth` will, depending on the value of `policy`, respond with a 403 before a user _has even been authenticated_.  The `allowUnauthenticated` option, when set to `true`, will allow requests where `request.auth.isAuthenticated` is `false` to proceed so that any authentication redirects can occur. |

### Plugin _only_ options

| Name | Type | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| policy | `string` | &quot;deny&quot; | &quot;deny&quot;&#124;&quot;allow&quot; | The policy that the plugin should follow.  If &quot;deny&quot; all routes will be secure, if &quot;allow&quot; all routes will be insecure.  This can be overridden with the `secure` option in a route. |

### Route _only_ options


| Name | Type | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| secure | `Boolean` | `true` | `true`&#124;`false` | Indicates whether or not a route should be secure, i.e. if the plugin should be used on a particular route. |
