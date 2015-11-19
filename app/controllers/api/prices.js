var express    = require('express');
var bodyParser = require('body-parser');
var Price      = require('../../models/price');
var router     = express.Router();

module.exports = function(app) {
  router.get("/prices", function (req, res, next) {
    Price.aggregate({ $group: { _id: '$symbol' }}, function (error, symbols) {
      res.json(symbols);
    });
  });

  router.get("/prices/:symbol", function (req, res, next) {
    var symbol = req.params.symbol;

    Price.find({symbol: symbol}, function(error, prices){
      res.json(prices);
    }).sort({date: 'asc'});
  });

  app.use('/api', router);
};