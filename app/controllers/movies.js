var express    = require('express');
var bodyParser = require('body-parser');
var Movie      = require('../models/movie');
var router     = express.Router();

module.exports = function(app) {
  router.get("/movies", function (req, res, next) {
    res.render('movies/index');
  });

  app.use('/', router);
};