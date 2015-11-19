var express    = require('express');
var bodyParser = require('body-parser');
var Movie      = require('../models/movie');
var router     = express.Router();

module.exports = function(app) {
  router.get("/prices", function (req, res, next) {
    res.render('prices/index');
  });

  router.get("/prices/:symbol", function (req, res, next) {
    var symbol = req.params.symbol;

    res.render('prices/show', {symbol: symbol});
  });

  app.use('/', router);
};