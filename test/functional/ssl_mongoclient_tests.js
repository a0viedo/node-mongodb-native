"use strict";

var fs = require('fs'),
  path = require('path'),
  f = require('util').format;

/**
 * @ignore
 */
exports.shouldCorrectlyCommunicateUsingSSLSocket = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ServerManager = require('mongodb-topology-manager').Server
      , MongoClient = configuration.require.MongoClient;

    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Start server
    var serverManager = new ServerManager('mongod', {
        journal: null
      , port: 27019
      , sslOnNormalPorts: null
      , sslPEMKeyFile: __dirname + "/ssl/server.pem"
      , dbpath: path.join(path.resolve('db'), f("data-%d", 27019))
    }, {
      ssl:true
    });

    serverManager.purge().then(function() {
      // Start the server
      serverManager.start().then(function() {
        setTimeout(function() {
          // Connect
          MongoClient.connect("mongodb://localhost:27019/test?ssl=true", {
            server: { sslValidate: false }
          }, function(err, db) {
            test.equal(null, err);
            test.ok(db != null);

            db.close();

            serverManager.stop().then(function() {
              test.done();
            });
          });
        }, 10000);
      });
    });
  }
}

/**
 * @ignore
 */
exports.shouldCorrectlyValidateServerCertificate = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ServerManager = require('mongodb-topology-manager').Server
      , MongoClient = configuration.require.MongoClient;

    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Read the ca
    var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];

    // Start server
    var serverManager = new ServerManager('mongod', {
        journal:null
      , sslOnNormalPorts: null
      , sslPEMKeyFile: __dirname + "/ssl/server.pem"
      // EnsureUp options
      , dbpath: path.join(path.resolve('db'), f("data-%d", 27019))
      , bind_ip: 'server'
      , port: 27019
    });

    serverManager.purge().then(function() {
      // Start the server
      serverManager.start().then(function() {
        setTimeout(function() {
          // Connect and validate the server certificate
          MongoClient.connect("mongodb://server:27019/test?ssl=true&maxPoolSize=1", {
            server: {
                sslValidate:true
              , sslCA:ca
            }
          }, function(err, db) {
            test.equal(null, err);
            test.ok(db != null);

            db.close();

            serverManager.stop().then(function() {
              test.done();
            });
          });
        }, 10000);
      });
    });
  }
}

/**
 * @ignore
 */
exports['should correctly validate ssl certificate and ignore server certificate host name validation'] = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ServerManager = require('mongodb-topology-manager').Server
      , MongoClient = configuration.require.MongoClient;

    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Did we get checkServerIdentity called
    var checkServerIdentityCalled = false;

    // Read the ca
    var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];

    // Start server
    var serverManager = new ServerManager('mongod', {
        journal:null
      , sslOnNormalPorts: null
      , sslPEMKeyFile: __dirname + "/ssl/server.pem"
      // EnsureUp options
      , dbpath: path.join(path.resolve('db'), f("data-%d", 27019))
      , bind_ip: 'server'
      , port: 27019
    });

    serverManager.purge().then(function() {
      // Start the server
      serverManager.start().then(function() {
        setTimeout(function() {
          // Connect and validate the server certificate
          MongoClient.connect("mongodb://server:27019/test?ssl=true&maxPoolSize=1", {
            server: {
                sslValidate:true
              , checkServerIdentity: function() {
                checkServerIdentityCalled = true;
                return undefined;
              }
              , sslCA:ca
            }
          }, function(err, db) {
            test.equal(null, err);
            test.ok(db != null);
            test.ok(checkServerIdentityCalled);

            db.close();

            serverManager.stop().then(function() {
              test.done();
            });
          });
        }, 10000);
      });
    });
  }
}

/**
 * @ignore
 */
exports['should fail to validate certificate due to illegal host name'] = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ServerManager = require('mongodb-topology-manager').Server
      , MongoClient = configuration.require.MongoClient;

    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Read the ca
    var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];

    // Start server
    var serverManager = new ServerManager('mongod', {
        journal:null
      , sslOnNormalPorts: null
      , sslPEMKeyFile: __dirname + "/ssl/server.pem"
      // EnsureUp options
      , dbpath: path.join(path.resolve('db'), f("data-%d", 27019))
      , bind_ip: 'server'
      , port: 27019
    });

    serverManager.purge().then(function() {
      // Start the server
      serverManager.start().then(function() {
        setTimeout(function() {
          // Connect and validate the server certificate
          MongoClient.connect("mongodb://localhost:27017/test?ssl=true&maxPoolSize=1", {
            server: {
                sslValidate:true
              , sslCA:ca
            }
          }, function(err, db) {
            test.ok(err != null);

            serverManager.stop().then(function() {
              test.done();
            });
          });
        }, 10000);
      });
    });
  }
}

/**
 * @ignore
 */
exports.shouldCorrectlyValidatePresentedServerCertificateAndPresentValidCertificate = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ServerManager = require('mongodb-topology-manager').Server
      , MongoClient = configuration.require.MongoClient;

    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Read the ca
    var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];
    var cert = fs.readFileSync(__dirname + "/ssl/client.pem");
    var key = fs.readFileSync(__dirname + "/ssl/client.pem");

    // Start server
    var serverManager = new ServerManager('mongod', {
        journal:null
      , sslOnNormalPorts: null
      , sslCAFile: __dirname + "/ssl/ca.pem"
      , sslCRLFile: __dirname + "/ssl/crl.pem"
      , sslPEMKeyFile: __dirname + "/ssl/server.pem"
      // EnsureUp options
      , dbpath: path.join(path.resolve('db'), f("data-%d", 27019))
      , bind_ip: 'server'
      , port: 27019
    });

    serverManager.purge().then(function() {
      // Start the server
      serverManager.start().then(function() {
        setTimeout(function() {
          // Connect and validate the server certificate
          MongoClient.connect("mongodb://server:27019/test?ssl=true&maxPoolSize=1", {
            server: {
                sslValidate:true
              , sslCA:ca
              , sslKey:key
              , sslCert:cert
              , sslPass:'10gen'
            }
          }, function(err, db) {
            test.equal(null, err);
            test.ok(db != null);

            db.close();

            serverManager.stop().then(function() {
              test.done();
            });
          });
        }, 10000);
      });
    });
  }
}

/**
 * @ignore
 */
exports.shouldValidatePresentedServerCertificateButPresentInvalidCertificate = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ServerManager = require('mongodb-topology-manager').Server
      , MongoClient = configuration.require.MongoClient;

    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Read the ca
    var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];
    var cert = fs.readFileSync(__dirname + "/ssl/client.pem");
    var key = fs.readFileSync(__dirname + "/ssl/client.pem");

    // Start server
    var serverManager = new ServerManager('mongod', {
        journal:null
      , sslMode: 'requireSSL'
      , sslCAFile: __dirname + "/ssl/ca.pem"
      , sslCRLFile: __dirname + "/ssl/crl.pem"
      , sslPEMKeyFile: __dirname + "/ssl/server.pem"
      // EnsureUp options
      , dbpath: path.join(path.resolve('db'), f("data-%d", 27019))
      , bind_ip: 'server'
      , port: 27019
    });

    serverManager.purge().then(function() {
      // Start the server
      serverManager.start().then(function() {
        setTimeout(function() {
          // Read the ca
          var cert = fs.readFileSync(__dirname + "/ssl/mycert.pem");
          var key = fs.readFileSync(__dirname + "/ssl/mycert.pem");

          // Connect and validate the server certificate
          MongoClient.connect("mongodb://server:27019/test?ssl=true&maxPoolSize=1", {
            server: {
                ssl:true
              , sslValidate:true
              , sslCA:ca
              , sslKey:key
              , sslCert:cert
              , sslPass:'10gen'
            }
          }, function(err, db) {
            test.ok(err != null);

            serverManager.stop().then(function() {
              test.done();
            });
          });
        }, 10000);
      });
    });
  }
}

/**
 * @ignore
 */
exports.shouldCorrectlyValidatePresentedServerCertificateAndInvalidKey = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ServerManager = require('mongodb-topology-manager').Server
      , MongoClient = configuration.require.MongoClient;

    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Read the ca
    var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];
    var cert = fs.readFileSync(__dirname + "/ssl/client.pem");
    var key = fs.readFileSync(__dirname + "/ssl/mycert.pem");

    // Start server
    var serverManager = new ServerManager('mongod', {
        journal:null
      , sslOnNormalPorts: null
      , sslCAFile: __dirname + "/ssl/ca.pem"
      , sslCRLFile: __dirname + "/ssl/crl.pem"
      , sslPEMKeyFile: __dirname + "/ssl/server.pem"
      // EnsureUp options
      , dbpath: path.join(path.resolve('db'), f("data-%d", 27019))
      , bind_ip: 'server'
      , port: 27019
    });

    serverManager.purge().then(function() {
      // Start the server
      serverManager.start().then(function() {
        setTimeout(function() {
          // Connect and validate the server certificate
          MongoClient.connect("mongodb://server:27019/test?ssl=true&maxPoolSize=1", {
            server: {
                sslValidate:true
              , sslCA:ca
              , sslKey:key
              , sslCert:cert
              , sslPass:'10gen'
            }
          }, function(err, db) {
            test.ok(err != null);

            serverManager.stop().then(function() {
              test.done();
            });
          });
        }, 10000);
      });
    });
  }
}

/**
 * @ignore
 */
exports['Should correctly shut down if attempting to connect to ssl server with wrong parameters'] = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ServerManager = require('mongodb-topology-manager').Server
      , MongoClient = configuration.require.MongoClient;

    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Start server
    var serverManager = new ServerManager('mongod', {
        journal: null
      , sslOnNormalPorts: null
      , sslPEMKeyFile: __dirname + "/ssl/server.pem"
      // EnsureUp options
      , dbpath: path.join(path.resolve('db'), f("data-%d", 27019))
      , bind_ip: 'server'
      , port: 27019
    });

    // Start server
    serverManager.purge().then(function() {
      // Start the server
      serverManager.start().then(function() {
        setTimeout(function() {
          MongoClient.connect("mongodb://localhost:27019/test?ssl=false", function(err, db) {
            test.ok(err != null);

            serverManager.stop().then(function() {
              test.done();
            });
          });
        }, 10000);
      });
    });
  }
}

/**
 * @ignore
 */
exports['should correctly connect using SSL to ReplSetManager'] = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSetManager = require('mongodb-topology-manager').ReplSet
      , MongoClient = configuration.require.MongoClient;

    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Read the ca
    var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];
    var cert = fs.readFileSync(__dirname + "/ssl/client.pem");
    var key = fs.readFileSync(__dirname + "/ssl/client.pem");

    var replicasetManager = new ReplSetManager('mongod', [{
      options: {
        bind_ip: 'server', port: 31000,
        dbpath: f('%s/../db/31000', __dirname),
        sslOnNormalPorts: null, sslPEMKeyFile: __dirname + "/ssl/server.pem"
      }
    }, {
      options: {
        bind_ip: 'server', port: 31001,
        dbpath: f('%s/../db/31001', __dirname),
        sslOnNormalPorts: null, sslPEMKeyFile: __dirname + "/ssl/server.pem"
      }
    }, {
      options: {
        bind_ip: 'server', port: 31002,
        dbpath: f('%s/../db/31002', __dirname),
        sslOnNormalPorts: null, sslPEMKeyFile: __dirname + "/ssl/server.pem"
      }
    }], {
      replSet: 'rs', ssl:true, rejectUnauthorized: false, ca: ca, host: 'server'
    });

    replicasetManager.purge().then(function() {
      // Start the server
      replicasetManager.start().then(function() {
        setTimeout(function() {
          // Connect and validate the server certificate
          MongoClient.connect("mongodb://server:31000,server:31001,server:31002/test?ssl=true&replicaSet=rs&maxPoolSize=1", {
            replSet: {
                ssl:true
              , sslValidate:false
              , sslCA:ca
            }
          }, function(err, db) {
            if(err) console.dir(err)
            test.equal(null, err);
            test.ok(db != null);

            db.close();

            replicasetManager.stop().then(function() {
              test.done();
            });
          });
        });
      }, 10000);
    });
  }
}

/**
 * @ignore
 */
exports.shouldCorrectlySendCertificateToReplSetAndValidateServerCertificate = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSetManager = require('mongodb-topology-manager').ReplSet
      , MongoClient = configuration.require.MongoClient;
    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Read the ca
    var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];
    var cert = fs.readFileSync(__dirname + "/ssl/client.pem");
    var key = fs.readFileSync(__dirname + "/ssl/client.pem");

    var replicasetManager = new ReplSetManager('mongod', [{
      options: {
        bind_ip: 'server', port: 31000,
        dbpath: f('%s/../db/31000', __dirname),
        sslPEMKeyFile: __dirname + "/ssl/server.pem", sslCAFile: __dirname + "/ssl/ca.pem",
        sslCRLFile: __dirname + "/ssl/crl.pem", sslMode: 'requireSSL'
      }
    }, {
      options: {
        bind_ip: 'server', port: 31001,
        dbpath: f('%s/../db/31001', __dirname),
        sslPEMKeyFile: __dirname + "/ssl/server.pem", sslCAFile: __dirname + "/ssl/ca.pem",
        sslCRLFile: __dirname + "/ssl/crl.pem", sslMode: 'requireSSL'
      }
    }, {
      options: {
        bind_ip: 'server', port: 31002,
        dbpath: f('%s/../db/31002', __dirname),
        sslPEMKeyFile: __dirname + "/ssl/server.pem", sslCAFile: __dirname + "/ssl/ca.pem",
        sslCRLFile: __dirname + "/ssl/crl.pem", sslMode: 'requireSSL'
      }
    }], {
      replSet: 'rs', ssl:true, rejectUnauthorized: false, key: cert, cert: cert, host: 'server'
    });

    replicasetManager.purge().then(function() {
      // Start the server
      replicasetManager.start().then(function() {
        setTimeout(function() {
          // Connect and validate the server certificate
          MongoClient.connect("mongodb://server:31000,server:31001/test?ssl=true&replicaSet=rs&maxPoolSize=1", {
            replSet: {
                sslValidate:false
              , sslCA:ca
              , sslKey:key
              , sslCert:cert
            }
          }, function(err, db) {
            if(err) console.dir(err);
            test.equal(null, err);
            test.ok(db != null);

            db.close();

            replicasetManager.stop().then(function() {
              test.done();
            });
          });
        }, 10000);
      }).catch(function(e) {
        console.dir(e)
      });
    });
  }
}

/**
 * @ignore
 */
exports.shouldSendWrongCertificateToReplSetAndValidateServerCertificate = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSetManager = require('mongodb-topology-manager').ReplSet
      , MongoClient = configuration.require.MongoClient;
    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Read the ca
    var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];
    var cert = fs.readFileSync(__dirname + "/ssl/client.pem");
    var key = fs.readFileSync(__dirname + "/ssl/client.pem");

    var replicasetManager = new ReplSetManager('mongod', [{
      options: {
        bind_ip: 'server', port: 31000,
        dbpath: f('%s/../db/31000', __dirname),
        sslPEMKeyFile: __dirname + "/ssl/server.pem", sslCAFile: __dirname + "/ssl/ca.pem",
        sslCRLFile: __dirname + "/ssl/crl.pem", sslMode: 'requireSSL'
      }
    }, {
      options: {
        bind_ip: 'server', port: 31001,
        dbpath: f('%s/../db/31001', __dirname),
        sslPEMKeyFile: __dirname + "/ssl/server.pem", sslCAFile: __dirname + "/ssl/ca.pem",
        sslCRLFile: __dirname + "/ssl/crl.pem", sslMode: 'requireSSL'
      }
    }, {
      options: {
        bind_ip: 'server', port: 31002,
        dbpath: f('%s/../db/31002', __dirname),
        sslPEMKeyFile: __dirname + "/ssl/server.pem", sslCAFile: __dirname + "/ssl/ca.pem",
        sslCRLFile: __dirname + "/ssl/crl.pem", sslMode: 'requireSSL'
      }
    }], {
      replSet: 'rs', ssl:true, rejectUnauthorized: false, key: cert, cert: cert, host: 'server'
    });

    replicasetManager.purge().then(function() {
      // Start the server
      replicasetManager.start().then(function() {
        setTimeout(function() {
          // Present wrong certificate
          var cert = fs.readFileSync(__dirname + "/ssl/mycert.pem");
          var key = fs.readFileSync(__dirname + "/ssl/mycert.pem");

          // Connect and validate the server certificate
          MongoClient.connect("mongodb://server:31000,server:31001/test?ssl=true&replicaSet=rs&maxPoolSize=1", {
            replSet: {
                sslValidate:true
              , sslCA:ca
              , sslKey:key
              , sslCert:cert
              , sslPass: '10gen'
            }
          }, function(err, db) {
            test.ok(err != null)

            replicasetManager.stop().then(function() {
              test.done();
            });
          });
        }, 10000);
      }).catch(function(e) {
        console.dir(e)
      });
    });
  }
}

/**
 * @ignore
 */
exports['should correctly to replicaset using ssl connect with password'] = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSetManager = require('mongodb-topology-manager').ReplSet
      , MongoClient = configuration.require.MongoClient;
    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Read the ca
    var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];
    var cert = fs.readFileSync(__dirname + "/ssl/client.pem");
    var key = fs.readFileSync(__dirname + "/ssl/client.pem");

    var replicasetManager = new ReplSetManager('mongod', [{
      options: {
        bind_ip: 'server', port: 31000,
        dbpath: f('%s/../db/31000', __dirname),
        sslPEMKeyFile: __dirname + "/ssl/server.pem", sslCAFile: __dirname + "/ssl/ca.pem",
        sslCRLFile: __dirname + "/ssl/crl.pem", sslMode: 'requireSSL'
      }
    }, {
      options: {
        bind_ip: 'server', port: 31001,
        dbpath: f('%s/../db/31001', __dirname),
        sslPEMKeyFile: __dirname + "/ssl/server.pem", sslCAFile: __dirname + "/ssl/ca.pem",
        sslCRLFile: __dirname + "/ssl/crl.pem", sslMode: 'requireSSL'
      }
    }, {
      options: {
        bind_ip: 'server', port: 31002,
        dbpath: f('%s/../db/31002', __dirname),
        sslPEMKeyFile: __dirname + "/ssl/server.pem", sslCAFile: __dirname + "/ssl/ca.pem",
        sslCRLFile: __dirname + "/ssl/crl.pem", sslMode: 'requireSSL'
      }
    }], {
      replSet: 'rs', ssl:true, rejectUnauthorized: false, key: cert, cert: cert, host: 'server'
    });

    replicasetManager.purge().then(function() {
      // Start the server
      replicasetManager.start().then(function() {
        setTimeout(function() {
          // Connect and validate the server certificate
          MongoClient.connect("mongodb://server:31000,server:31001/test?ssl=true&replicaSet=rs&maxPoolSize=1", {
            replSet: {
                sslValidate:true
              , sslCA:ca
              , sslKey:key
              , sslCert:cert
              , sslPass: '10gen'
            }
          }, function(err, db) {
            test.equal(null, err)

            replicasetManager.stop().then(function() {
              test.done();
            });
          });
        }, 10000);
      });
    });
  }
}

/**
 * @ignore
 */
exports['should correctly connect using ssl with sslValidation turned off'] = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSetManager = require('mongodb-topology-manager').ReplSet
      , MongoClient = configuration.require.MongoClient;

    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Read the ca
    var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];
    var cert = fs.readFileSync(__dirname + "/ssl/client.pem");
    var key = fs.readFileSync(__dirname + "/ssl/client.pem");

    var replicasetManager = new ReplSetManager('mongod', [{
      options: {
        bind_ip: 'server', port: 31000,
        dbpath: f('%s/../db/31000', __dirname),
        sslOnNormalPorts: null, sslPEMKeyFile: __dirname + "/ssl/server.pem"
      }
    }, {
      options: {
        bind_ip: 'server', port: 31001,
        dbpath: f('%s/../db/31001', __dirname),
        sslOnNormalPorts: null, sslPEMKeyFile: __dirname + "/ssl/server.pem"
      }
    }, {
      options: {
        bind_ip: 'server', port: 31002,
        dbpath: f('%s/../db/31002', __dirname),
        sslOnNormalPorts: null, sslPEMKeyFile: __dirname + "/ssl/server.pem"
      }
    }], {
      replSet: 'rs', ssl:true, rejectUnauthorized: false, key: cert, cert: cert, host: 'server'
    });

    replicasetManager.purge().then(function() {
      // Start the server
      replicasetManager.start().then(function() {
        setTimeout(function() {
          // Connect and validate the server certificate
          MongoClient.connect("mongodb://server:31000,server:31001/test?ssl=true&replicaSet=rs&maxPoolSize=1", {
            replSet: {
                ssl:true
              , sslValidate:false
            }
          }, function(err, db) {
            test.equal(null, err);
            test.ok(db != null);

            db.close();

            replicasetManager.stop().then(function() {
              test.done();
            });
          });
        }, 10000);
      });
    });
  }
}

/**
 * @ignore
 */
exports['should correctly connect using SSL to replicaset with requireSSL'] = {
  metadata: { requires: { topology: 'ssl' } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSetManager = require('mongodb-topology-manager').ReplSet
      , MongoClient = configuration.require.MongoClient;

    // All inserted docs
    var docs = [];
    var errs = [];
    var insertDocs = [];

    // Read the ca
    var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];
    var cert = fs.readFileSync(__dirname + "/ssl/client.pem");
    var key = fs.readFileSync(__dirname + "/ssl/client.pem");
    var replicasetManager = new ReplSetManager('mongod', [{
      options: {
        bind_ip: 'server', port: 31000,
        dbpath: f('%s/../db/31000', __dirname),
        sslPEMKeyFile: __dirname + "/ssl/server.pem",
        sslMode: 'requireSSL'
      }
    }, {
      options: {
        bind_ip: 'server', port: 31001,
        dbpath: f('%s/../db/31001', __dirname),
        sslPEMKeyFile: __dirname + "/ssl/server.pem",
        sslMode: 'requireSSL'
      }
    }, {
      options: {
        bind_ip: 'server', port: 31002,
        dbpath: f('%s/../db/31002', __dirname),
        sslPEMKeyFile: __dirname + "/ssl/server.pem",
        sslMode: 'requireSSL'
      }
    }], {
      replSet: 'rs', ssl:true, rejectUnauthorized: false, ca: ca, host: 'server'
    });

    replicasetManager.purge().then(function() {
      // Start the server
      replicasetManager.start().then(function() {
        setTimeout(function() {
          // Connect and validate the server certificate
          MongoClient.connect("mongodb://server:31000,server:31001,server:31002/test?replicaSet=rs", {
            replSet: {
                ssl:true
              , sslKey: key
              , sslCert: cert
              , sslCA:ca
            }
          }, function(err, db) {
            if(err) console.dir(err)
            test.equal(null, err);
            test.ok(db != null);
            var sets = [{}];

            var interval = setInterval(function() {
              db.command({ismaster:true}, {readPreference:'nearest', full:true}, function(e, r) {
                // Add seen servers to list
                if(r) {
                  sets[sets.length - 1][r.connection.port] = true;
                }
              });
            }, 100)

            setTimeout(function() {
              // Force a reconnect of a server
              var secondary = db.serverConfig.s.replset.state.secondaries[0]
              secondary.destroy(true, false);
              sets.push({});

              db.serverConfig.once('joined', function(t, o, s) {
                setTimeout(function() {
                  clearInterval(interval);

                  test.ok(sets[0][31000]);
                  test.ok(sets[0][31001]);
                  test.ok(sets[0][31002]);

                  test.ok(sets[1][31000]);
                  test.ok(sets[1][31001]);
                  test.ok(sets[1][31002]);

                  db.close();

                  replicasetManager.stop().then(function() {
                    test.done();
                  });
                }, 1000);
              });
            }, 2000)
          });
        });
      }, 10000).catch(function(err) {
        console.dir(err)
        process.exit(0)
      });
    });
  }
}
