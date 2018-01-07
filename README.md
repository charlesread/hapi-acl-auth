[![Build Status](https://travis-ci.org/charlesread/hapi-acl-auth.svg?branch=master)](https://travis-ci.org/charlesread/hapi-acl-auth)

<strong>
    Note: most examples in the examples directory are for previous versions, although the logic will still be the same, they will not work with versions 1.x of the plugin.
</strong>

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
- [Change Log](#change-log)
  * [1.0.x](#10x)
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

/*

 Simple example.

 Policy is `deny`, by default.
 User has one role ('admin').
 User has role required by /admin.
 User does not have role required by /superuser.
 Endpoint /notsecure has secure: false, thus overriding the default deny policy.

 */

const Hapi = require('hapi')

const server = Hapi.server({
  host: 'localhost',
  port: 8000
})

!async function () {
  await server.register({
    plugin: require('hapi-acl-auth'),
    options: {
      handler: async function () {
        return {user: 'cread', roles: ['admin']}
      },
      // optional, dy default a simple 403 will be returned when not authorized
      forbiddenPageFunction: async function (credentials, request, h) {
        // some fancy "logging"
        console.log('%s (roles: %s) wanted %s (requires %s) but was not allowed', credentials.user, credentials.roles, request.path, request.route.settings.plugins['hapiAclAuth'].roles)
        // some fancy error page
        const response = h.response('<h1>Not Authorized!</h1>')
        response.code(200)
        return response.takeover()
      }
    }
  })
  server.route({
    method: 'get',
    path: '/admin',
    handler: async function (request, h) {
      return '<h1>Welcome to /admin!</h1>'
    },
    config: {
      plugins: {
        hapiAclAuth: {
          roles: ['admin']
        }
      }
    }
  })
  server.route({
    method: 'get',
    path: '/superuser',
    handler: async function (request, h) {
      return '<h1>Welcome to /superuser!</h1>'
    },
    config: {
      plugins: {
        hapiAclAuth: {
          roles: ['superuser']
        }
      }
    }
  })
  server.route({
    method: 'get',
    path: '/notsecure',
    handler: async function (request, h) {
      return '<h1>Welcome to /notsecure!</h1>'
    },
    config: {
      plugins: {
        hapiAclAuth: {
          secure: false
        }
      }
    }
  })
  await server.start()
}()
  .then(function () {
    console.log('server started: %s', server.info.uri)
  })
  .catch(function (err) {
    console.error(err.message)
  })
```

## Change Log

### 1.0.x
* `hapi-acl-auth` is now fully compatible with Hapi version 17 and above
* All `function`s have been replaced with `async function`s
* If you need Hapi version 16 support see the 0.x releases

## Plugin/Route Configuration Options

Most options can be specified at the plugin level, or for each individual route.  In other words, you can "lock down" every route all at once, or at each route, or both (with route config overriding plugin config).

### Plugin _and_ route options

| Name | Type | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| handler (required) | `[async] function(request)` |  |  | This function must return an object (referred to as `handlerObject` henceforth), the object can be arbitrary, but it must contain a `roles` attribute that is an Array (or a function that returns an array) of roles that are allowed for the route (or routes, if configured in the plugin options).|
| roles (required) | `Array`&#124;`[async] function(handlerObject, request)` |  |  | An `Array` of roles (or an `[async] function` that returns an array of roles) that are allowed for the route or routes.  *NOTE*: this attribute can be set at the plugin or route level, if it is set at the plugin level it will apply to _all_ routes, if set on an individual route it only applies to that route, but you can set a "policy" at the plugin level and then override it in individual routes should you so desire. |
| any | `Boolean` | `true` | `true`&#124;`false` | Apecifies whether a user may possess _any_ of the allowed roles in order to be authorized. |
| all | `Boolean` | `false` | `true`&#124;`false` | Apecifies whether a user _must_ possess _all_ of the allowed routes in order to be authorized. |
| hierarchy | `Array` |  |  | An `Array` that specifies the privilege hierarchy of roles in order of ascending privilege.  For instance, suppose we have  `hierarchy: ['user', 'admin', 'superuser]` configured for a route and `roles: ['admin']` configured for that same route.  A user with the `superuser` role will be able to access that route because the `superuser` role is of higher privilege than the `admin` role, as specified in the hierarchy. |
| forbiddenPageFunction | `[async] function(handlerObject, request, h)` |  |  | By default the plugin will respond with a plain `Boom.forbidden()`, so you can use this function to override that behavior and do whatever you want.  It is worth noting that if you use this function it is <strong>your responsibility to respond to the request</strong>.  Thus you must return an error (preferably a Boom), a takeover response, or a continue signal.|
| cache | `Boolean` | `false` | `true`&#124;`false` | If caching is enabled the `roles` arrays will be cached, this is helpful if you use resource intensive functions to return roles in the `handler` function or the `roles` attribute |
| allowUnauthenticated | `Boolean` | `false` | `true`&#124;`false` | `hapi-acl-auth` makes use of the `onPostAuth` extension point, basically it does its processing to determine whether or not a user should have access before Hapi responds to a request. If you're using an authentication plugin for Hapi, or anything else really, that performs a redirect in order to authenticate, `hapi-acl-auth` will, depending on the value of `policy`, respond with a 403 before a user _has even been authenticated_.  The `allowUnauthenticated` option, when set to `true`, will allow requests where `request.auth.isAuthenticated` is `false` to proceed so that any authentication redirects can occur. |

### Plugin _only_ options

| Name | Type | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| policy | `string` | &quot;deny&quot; | &quot;deny&quot;&#124;&quot;allow&quot; | The policy that the plugin should follow.  If &quot;deny&quot; all routes will be secure, if &quot;allow&quot; all routes will be insecure.  This can be overridden with the `secure` option in a route. |

### Route _only_ options


| Name | Type | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| secure | `Boolean` | `true` | `true`&#124;`false` | Indicates whether or not a route should be secure, i.e. if the plugin should be used on a particular route. |
