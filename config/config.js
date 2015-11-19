var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'lesson-node-web-scrape-and-charts'
    },
    port: 3000,
    db: 'mongodb://localhost/yakuza-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'lesson-node-web-scrape-and-charts'
    },
    port: 3000,
    db: 'mongodb://localhost/yakuza-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'lesson-node-web-scrape-and-charts'
    },
    port: 3000,
    db: 'mongodb://localhost/yakuza-production'
  }
};

module.exports = config[env];