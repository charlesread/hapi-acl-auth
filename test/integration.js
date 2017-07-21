'use strict'

const chai = require('chai')

chai.should()

const path = require('path')
const Hapi = require('hapi')
const request = require('request')

let server

const plugin = require(path.join(__dirname, '..', 'index.js'))
const cache = require(path.join(__dirname, '..', 'lib', 'cache.js'))()

const url = 'http://localhost:9999/protected'
const method = 'get'

describe('integration testing', function () {

  //
  beforeEach(function (done) {
    server = new Hapi.Server()
    server.connection({
      host: 'localhost',
      port: 9999
    })
    done()
  })
  afterEach(function (done) {
    cache.reset()
    server.stop({timeout: 5000}, function (err) {
      if (err) {
        console.error(err.message)
      }
      server = undefined
      done()
    })
  })
  //

  it('secure endpoint should return 403 when required route role does not match user role', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['USER']})
          }
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN'],
                secure: true
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(403)
              done()
            }
          )
        })
      }
    )
  })

  it('secure endpoint should return 403 when no required route roles match any user roles', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['USER', 'REPORTER']})
          }
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN', 'SUPERUSER'],
                secure: true
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(403)
              done()
            }
          )
        })
      }
    )
  })

  it('secure endpoint should return 200 when required route role DOES match user role', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['USER']})
          }
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['USER'],
                secure: true
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(200)
              done()
            }
          )
        })
      }
    )
  })

  it('secure endpoint should return 200 when any required route role DOES match a user role', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['USER']})
          }
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['USER', 'ADMIN'],
                secure: true
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(200)
              done()
            }
          )
        })
      }
    )
  })

  it('secure endpoint should return 200 when ALL required route roles DO match ALL user roles', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['USER', 'pizza']})
          },
          all: true
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['USER', 'pizza'],
                secure: true
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(200)
              done()
            }
          )
        })
      }
    )
  })

  it('secure endpoint should return 200 when ALL required route roles DO NOT match ALL user roles', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['USER', 'pizza']})
          },
          all: true
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['USER', 'pizza', 'bread'],
                secure: true
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(403)
              done()
            }
          )
        })
      }
    )
  })

  it('insecure endpoint should return 200 when policy is allow', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['USER', 'pizza']})
          },
          policy: 'allow'
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/notprotected',
          handler: function (request, reply) {
            return reply()
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url: 'http://localhost:9999/notprotected', method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(200)
              done()
            }
          )
        })
      }
    )
  })

  it('insecure endpoint should return 403 when policy is deny', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['USER', 'pizza']})
          },
          policy: 'deny'
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/notprotected',
          handler: function (request, reply) {
            return reply()
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url: 'http://localhost:9999/notprotected', method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(403)
              done()
            }
          )
        })
      }
    )
  })

  it('insecure endpoint should return 200 when policy is deny but route has secure as false', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['USER', 'pizza']})
          },
          policy: 'deny'
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/notprotected',
          handler: function (request, reply) {
            return reply()
          },
          config: {
            plugins: {
              hapiAclAuth: {
                secure: false
              }
            }
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url: 'http://localhost:9999/notprotected', method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(200)
              done()
            }
          )
        })
      }
    )
  })

  it('when a hierarchy is used a higher privileged role should be able to access a route with a lower privileged role', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['ADMIN']})
          },
          hierarchy: ['USER', 'ADMIN', 'SUPERUSER']
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['USER'],
                secure: true
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(200)
              done()
            }
          )
        })
      }
    )
  })

  it('when a hierarchy is used a lower privileged role should NOT be able to access a route with a higher privileged role', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['USER']})
          },
          hierarchy: ['USER', 'ADMIN', 'SUPERUSER']
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN'],
                secure: true
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(403)
              done()
            }
          )
        })
      }
    )
  })

  it('if policy is set to allow then a route with no config should not be secure, even if other options should deny (if not overridden in route)', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['USER']})
          },
          hierarchy: ['USER', 'ADMIN', 'SUPERUSER'],
          policy: 'allow'
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN']
                // if  secure: true the test should fail
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(200)
              done()
            }
          )
        })
      }
    )
  })

  it('if policy is set to allow then a route with no config should be secure if secure: true is in route config: user does NOT have appropriate role', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['USER']})
          },
          hierarchy: ['USER', 'ADMIN', 'SUPERUSER'],
          policy: 'allow'
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN'],
                secure: true
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(403)
              done()
            }
          )
        })
      }
    )
  })

  it('if policy is set to allow then a route with no config should be secure if secure: true is in route config: user DOES have appropriate role', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['SUPERUSER']})
          },
          hierarchy: ['USER', 'ADMIN', 'SUPERUSER'],
          policy: 'allow'
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN'],
                secure: true
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(200)
              done()
            }
          )
        })
      }
    )
  })

  it('enabling the cache shouldn\'t kill everything', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['SUPERUSER']})
          },
          hierarchy: ['USER', 'ADMIN', 'SUPERUSER'],
          policy: 'allow',
          cache: true
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN'],
                secure: true
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              httpResponse.statusCode.should.equal(200)
              done()
            }
          )
        })
      }
    )
  })

  it('if cache is enabled it should contain a cached path object', function (done) {
    server.register({
        register: plugin,
        options: {
          handler: function (request, callback) {
            callback(null, {username: 'cread', roles: ['SUPERUSER']})
          },
          hierarchy: ['USER', 'ADMIN', 'SUPERUSER'],
          policy: 'allow',
          cache: true
        }
      },
      function (err) {
        if (err) throw err
        server.route({
          method,
          path: '/protected',
          config: {
            plugins: {
              hapiAclAuth: {
                roles: ['ADMIN'],
                secure: true
              }
            }
          },
          handler: function (request, reply) {
            return reply('protected')
          }
        })
        server.start(function (err) {
          if (err) throw err
          request({url, method},
            function (err, httpResponse, body) {
              if (err) throw err
              cache.get('/protected').should.have.own.property('allowed')
              cache.get('/protected').should.have.own.property('actual')
              httpResponse.statusCode.should.equal(200)
              done()
            }
          )
        })
      }
    )
  })

})