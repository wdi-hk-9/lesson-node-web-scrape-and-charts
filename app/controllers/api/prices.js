var express    = require('express');
var bodyParser = require('body-parser');
var Price      = require('../../models/price');
var router     = express.Router();

module.exports = function(app) {
  router.get("/prices", function (req, res, next) {
    // your code here
  });

  router.get("/prices/:symbol", function (req, res, next) {
    // your code here
  });

  app.use('/api', router);
};