var Yakuza   = require('yakuza');
var cheerio  = require('cheerio');
var mongoose = require('mongoose');
var Movie    = require('../app/models/movie');
var config   = require('../config/config');
mongoose.connect(config.db);

// IMDB
// Get top 250 movie
Yakuza.scraper('movie');
Yakuza.agent('movie', 'imdb').plan(['top250']); //, 'open', 'close', 'high', 'low', 'volume'
Yakuza.task('movie', 'imdb', 'top250').main(function (task, http, params) {
  var url = 'http://www.imdb.com/chart/top?ref_=nv_mv_250_6';

  http.get(url, function (error, res, html){
    if (error) { return task.fail(error); }

    var $ = cheerio.load(html);
    var movies = $("tbody.lister-list > tr");
    var moviesList = [];

    movies.each(function (index, movie){
      movie = $(movie);

      var img, title, rating;

      img = movie.find('.posterColumn > a > img').attr("src");
      title = movie.find('.titleColumn > a').html() + " " + movie.find('.titleColumn > span').html();
      rating = movie.find('.imdbRating > strong').html();

      moviesList.push({
        img: img,
        title: title,
        rating: rating
      });
    });

    return task.success({message: "Completed top250", moviesList: moviesList});
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

var top250 = Yakuza.job('movie', 'imdb', {someParams: "someParams"}).enqueue('top250');
top250.on('task:top250:success', function (task) {
  var moviesList = task.data.moviesList;
  moviesList.forEach(function (movie) {
    saveMovie(movie);
  });
});
top250.run();

function saveMovie (movie) {
  Movie.findOneAndUpdate({title: movie.title}, movie, function (error, movie) {
    if (error) { return console.log(error); }
    if (!movie) {
      movie = new Movie(movie);
      movie.save(function (error) {
        if (error) { console.log(error); }
        return console.log("Movie Created >>> " + movie.title);
      });
    } else {
      return console.log("Movie Updated >>> " + movie.title);
    }
  });
}