var Yakuza   = require('yakuza');
var cheerio  = require('cheerio');
var mongoose = require('mongoose');
var Price    = require('../app/models/price');
var config   = require('../config/config');
mongoose.connect(config.db);

// Yahoo Finance
// Get all historical data for Apple
var symbol = "AAPL";
Yakuza.scraper('finance');
Yakuza.agent('finance', 'yahoo').plan(['starter', 'getData']);

Yakuza.task('finance', 'yahoo', 'starter').main(function (task, http, params){
  var symbol = params.symbol;
  var opt    = {
    url: "http://finance.yahoo.com/q/hp?s=" + symbol,
    open_timeout: 5000
  };

  console.log("Starting Starter");
  http.get(opt, function (error, res, html){
    if (error) { return task.fail(error); }

    var $ = cheerio.load(html, {normalizeWhitespace: true});
    var linkData = $('table:nth-child(2) > tr:nth-child(1) > td:nth-child(1) > a:nth-child(4)').attr('href');
    var linkParams = parseLinkData(linkData);

    var params = {
      symbol: symbol,
      pages: linkParams.pages,
      items: linkParams.items,
      page: 0,
      offset: 0
    };

    return task.success({message: "Completed Starter", params: params});
  });
}).builder(function (job){
  return job.params;
}).hooks({
  onFail: function (task) {
    if (task.runs <= 5) {
      rerunTask(task);
    } else {
      console.log(task.error.code + " >>> FOR >>> ", task.params);
    }
  }
});

Yakuza.task('finance', 'yahoo', 'getData').main(function (task, http, params){
  var symbol = params.symbol;
  var page   = params.page;
  var items  = params.items;
  var offset = params.offset;
  var opt    = {
    url: "http://finance.yahoo.com/q/hp?s=" + symbol + "&z=" + items + "&y=" + offset,
    open_timeout : 5000
  };

  console.log("Starting getData for page " + page);
  http.get(opt, function (error, res, html) {
    if (error) { return task.fail(error); }

    var $ = cheerio.load(html, {normalizeWhitespace: true});

    params.pageData = getDataFromPage($, symbol);

    return task.success({message: "Completed getData for page " + page, params: params});
  });
}).builder(function (job) {
  return job.params;
}).hooks({
  onFail: function (task) {
    if (task.runs <= 5) {
      rerunTask(task);
    } else {
      console.log(task.error.code + " >>> FOR >>> ", task.params);
    }
  }
});

// Start my scraper
startStarter();

// function for my tasks
function startStarter () {
  var starter = Yakuza.job('finance', 'yahoo', {symbol: symbol}).enqueue('starter');
  starter.on('task:starter:success', function (task) {
    console.log(task.data.message);
    startGetData(task.data.params);
  });
  starter.run();
}

function startGetData (params) {
  var getData = Yakuza.job('finance', 'yahoo', params).enqueue('getData');
  getData.on('task:getData:success', function (task) {
    console.log(task.data.message);
    console.log("PAGE >>> ", task.data.params.page, " OFFSET >>> ", task.data.params.offset);
    var oldParams = task.data.params;
    var symbol    = oldParams.symbol;
    var pageData  = oldParams.pageData;

    for (var i = 0; i < pageData.length; i++) {
      saveData(pageData[i]);
    }

    if (oldParams.page < oldParams.pages) {
      var newParams = oldParams;
      newParams.page++;
      newParams.offset += 66;
      startGetData(newParams);
    } else {
      console.log("COMPLETED ALL PAGES");
    }
  });
  getData.run();
}

function parseLinkData (linkData) {
  var params = {};
  var queries = linkData.split("&");
  queries.forEach(function (query, index) {
    var queryArr = query.split("=");
    var key      = queryArr[0];
    var value    = parseInt(queryArr[1]);

    if (key === "z") { params.items = value; }
    if (key === "y") { params.maxOffset = value; }
  });
  params.pages = Math.ceil(params.maxOffset / params.items);

  return params;
}

function getDataFromPage ($, symbol) {
  var trs = $('.yfnc_datamodoutline1 > tr > td > table > tr');

  var pageData = [];
  trs.each(function (index, tr){
    var td = $(tr).find('td');
    var day = {};

    if (td.length < 7) { return; }
    if (index === 0)   { return; }

    day.date    = new Date(td.eq(0).html());
    day.dateStr = td.eq(0).html();
    day.open    = parseFloat(td.eq(1).html());
    day.high    = parseFloat(td.eq(2).html());
    day.low     = parseFloat(td.eq(3).html());
    day.close   = parseFloat(td.eq(4).html());
    day.volumn  = parseFloat(td.eq(5).html());
    day.symbol  = symbol;

    pageData.push(day);
  });
  return pageData;
}

function saveData (data) {
  Price.findOne({symbol: symbol, date: data.date}, function (error, price) {
    if (price) {
      console.log("ALREADY EXIST >>> " + data.dateStr + " FOR >>> " + symbol);
    } else {
      if (error) { return console.log(error); }
      price = new Price(data);
      price.save(function (error) {
        if (error) { return console.log(error); }
        console.log("SAVED >>> " + data.dateStr + " FOR >>> " + symbol);
      });
    }
  });
}

function wait (ms){
  var start = new Date().getTime();
  var end = start;
  while(end < start + ms) {
    end = new Date().getTime();
  }
}

function rerunTask (task) {
  console.log("RETRYING IN 5000 >>> ", task.params);
  wait(5000);
  task.rerun();
}
