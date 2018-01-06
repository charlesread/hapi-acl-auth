'use strict'

const chai = require('chai')

chai.should()

const path = require('path')
const Hapi = require('hapi')
const boom = require('boom')
const request = require('request')

let server

const plugin = require(path.join(__dirname, '..', 'index.js'))
const cache = require(path.join(__dirname, '..', 'lib', 'cache.js'))()

const url = 'http://localhost:9999/protected'
const method = 'get'

describe('integration testing', function () {

  beforeEach(function (done) {
    server = Hapi.server({
      host: 'localhost',
      port: 9999
    })
    done()
  })
  afterEach(function (done) {
    cache.reset()
    server.stop({timeout: 5000})
      .then(function () {
        done()
      })
      .catch(function (err) {
        console.error(err.message)
        done()
      })
  })

  it('secure endpoint should return 403 when required route role does not match user role', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER']}
        }
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN'],
                secure: true
              }
            }
          },
          handler: function (req, h) {
            return 'protected'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(403)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('secure endpoint should return 403 when no required route roles match any user roles', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER', 'REPORTER']}
        }
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN'],
                secure: true
              }
            }
          },
          handler: function (req, h) {
            return 'protected'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(403)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('secure endpoint should return 200 when A required route role DOES match user role', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER']}
        }
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['USER'],
                secure: true
              }
            }
          },
          handler: function (req, h) {
            return 'protected'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(200)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('secure endpoint should return 200 when ANY required route role DOES match a user role', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER']}
        }
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['USER', 'ADMIN'],
                secure: true,
                any: true //default
              }
            }
          },
          handler: function (req, h) {
            return 'protected'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(200)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('secure endpoint should return 200 when ALL required route roles DO match ALL user roles', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER', 'pizza']}
        }
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['USER', 'pizza'],
                secure: true,
                all: true
              }
            }
          },
          handler: function (req, h) {
            return 'protected'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(200)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('secure endpoint should return 403 when ALL required route roles DO NOT match ALL user roles', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER', 'pizza']}
        }
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['USER', 'pizza', 'cheese'],
                secure: true,
                all: true
              }
            }
          },
          handler: function (req, h) {
            return 'protected'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(403)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('insecure endpoint should return 200 when policy is allow', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER', 'pizza']}
        },
        policy: 'allow'
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/insecure',
          handler: async function (req, h) {
            return 'insecure'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url: 'http://localhost:9999/insecure', method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(200)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('insecure endpoint should return 403 when policy is deny', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER', 'pizza']}
        },
        policy: 'deny'
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/insecure',
          handler: async function (req, h) {
            return 'insecure'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url: 'http://localhost:9999/insecure', method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(403)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('insecure endpoint should return 200 when policy is deny but route has secure as false', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER', 'pizza']}
        },
        policy: 'deny'
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/insecure',
          config: {
            plugins: {
              hapiAclAuth: {
                secure: false
              }
            }
          },
          handler: async function (req, h) {
            return 'insecure'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url: 'http://localhost:9999/insecure', method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(200)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('when a hierarchy is used a higher privileged role should be able to access a route with a lower privileged role', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['ADMIN']}
        },
        hierarchy: ['USER', 'ADMIN', 'SUPERUSER']
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['USER']
              }
            }
          },
          handler: async function (req, h) {
            return 'insecure'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(200)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('if policy is set to allow then a route with no config should not be secure, even if other options should deny (if not overridden in route)', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER']}
        },
        hierarchy: ['USER', 'ADMIN', 'SUPERUSER'],
        policy: 'allow'
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN'],
                // if  secure: true the test should fail
              }
            }
          },
          handler: async function (req, h) {
            return 'insecure'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(200)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })


  it('when a hierarchy is used a lower privileged role should NOT be able to access a route with a lower privileged role', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER']}
        },
        hierarchy: ['USER', 'ADMIN', 'SUPERUSER']
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN']
              }
            }
          },
          handler: async function (req, h) {
            return 'insecure'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(403)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('if policy is set to allow then a route with no config should be secure if secure: true is in route config: user does NOT have appropriate role', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER']}
        },
        hierarchy: ['USER', 'ADMIN', 'SUPERUSER'],
        policy: 'allow'
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN'],
                secure: true
              }
            }
          },
          handler: async function (req, h) {
            return 'insecure'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(403)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('if policy is set to allow then a route with no config should be secure if secure: true is in route config: user DOES have appropriate role', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER']}
        },
        hierarchy: ['USER', 'ADMIN', 'SUPERUSER'],
        policy: 'allow'
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['SUPERUSER'],
                secure: true
              }
            }
          },
          handler: async function (req, h) {
            return 'insecure'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(403)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })


  it('enabling the cache shouldn\'t kill everything', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER']}
        },
        hierarchy: ['USER', 'ADMIN', 'SUPERUSER'],
        policy: 'allow',
        cache: true
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['SUPERUSER'],
                secure: true
              }
            }
          },
          handler: async function (req, h) {
            return 'insecure'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(403)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('if cache is enabled it should contain a cached path object', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER']}
        },
        hierarchy: ['USER', 'ADMIN', 'SUPERUSER'],
        policy: 'allow',
        cache: true
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['SUPERUSER'],
                secure: true
              }
            }
          },
          handler: async function (req, h) {
            return 'insecure'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(403)
            cache.get('/protected').should.have.own.property('allowed')
            cache.get('/protected').should.have.own.property('actual')
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('secure endpoint should return 403 when required route role does not match user role and forbiddenPageFunction returns a 403 Boom', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER']}
        },
        forbiddenPageFunction: async function (credentials, req, h) {
          return boom.forbidden()
        }
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN'],
                secure: true
              }
            }
          },
          handler: function (req, h) {
            return 'protected'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(403)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

  it('secure endpoint should return 407 when required route role does not match user role and forbiddenPageFunction returns a 407 response', function (done) {
    server.register({
      plugin: plugin,
      options: {
        handler: async function (req) {
          return {username: 'cread', roles: ['USER']}
        },
        forbiddenPageFunction: async function (credentials, req, h) {
          const response = h.response()
          response.code(407)
          return response.takeover()
        }
      }
    })
      .then(function () {
        server.route({
          method: 'get',
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN'],
                secure: true
              }
            }
          },
          handler: function (req, h) {
            return 'protected'
          }
        })
        return Promise.resolve()
      })
      .then(function () {
        return server.start()
      })
      .then(function () {
        request({url, method},
          function (err, httpResponse, body) {
            if (err) throw err
            httpResponse.statusCode.should.equal(407)
            done()
            return true
          }
        )
      })
      .catch(function (err) {
        console.error(err.message)
        console.error(err.stack)
        if (err) throw err
      })
  })

})