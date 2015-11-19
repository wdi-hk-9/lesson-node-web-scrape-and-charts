$(document).ready(function(){
  $.ajax({
    url: '/api/prices',
    method: 'get',
    success: function (data) {
      data.forEach(function(symbol){
        var li = '<li><a href="/prices/' + symbol._id + '">' + symbol._id + '</a></li>';
        $('#symbol-list').append(li);
      });
    }
  });

  var url = window.location.pathname.split('/')[2];
  $.ajax({
    url: '/api/prices/' + url,
    method: 'get',
    success: function (data) {
      var parsedData = parseData(data);
      plotChart(parsedData);
    }
  });
});

function parseData (data) {
  var parsedData = {
    open:   [],
    close:  [],
    high:   [],
    low:    [],
    volume: []
  };
  data.forEach(function (day) {
    var date = new Date(day.date);
    parsedData.open.push([date, day.open]);
    parsedData.close.push([date, day.close]);
    parsedData.high.push([date, day.high]);
    parsedData.low.push([date, day.low]);
    parsedData.volume.push([date, day.volume]);
  });
  return parsedData;
}

function plotChart (parsedData) {
  $('#highstock').highcharts('StockChart', {
    rangeSelector : {
      selected : 1
    },

    title : {
      text : 'Stock Price'
    },

    series : [
      {
        name : 'open',
        data : parsedData.open,
        tooltip: {
          valueDecimals: 2
        }
      },
      {
        name : 'close',
        data : parsedData.close,
        tooltip: {
          valueDecimals: 2
        }
      },
      {
        name : 'high',
        data : parsedData.high,
        tooltip: {
          valueDecimals: 2
        }
      },
      {
        name : 'low',
        data : parsedData.low,
        tooltip: {
          valueDecimals: 2
        }
      },
      {
        name : 'volume',
        data : parsedData.volume,
        tooltip: {
          valueDecimals: 2
        }
      }
    ]
  });
}