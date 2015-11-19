var express        = require('express');
var expressLayouts = require('express-ejs-layouts');
var glob           = require('glob');
var logger         = require('morgan');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');

module.exports = function(app, config) {
  var env = process.env.NODE_ENV || 'development';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';

  app.set('views', config.root + '/app/views');
  app.set('view engine', 'ejs');

  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(methodOverride());
  app.use(express.static(config.root + '/public'));
  app.use(expressLayouts);

  var controllers = glob.sync(config.root + '/app/controllers/*.js');
  controllers.forEach(function (controller) {
    require(controller)(app);
  });

  var apiControllers = glob.sync(config.root + '/app/controllers/api/*.js');
  apiControllers.forEach(function (controller) {
    require(controller)(app);
  });

  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
      res.send('error', {
        message: err.message,
        error: err,
        title: 'error'
      });
  });
};