# Node Scraping

## Intro
Scraping is fun! You can *steal* all the data you want from website and do whatever the heck you want with it.

Aside from that you can also avoid paying costly APIs for the same information.

## Scraping

### Setup
All you need for this is three libraries. These should already be inside the `package.json`

```bash
npm install yakuza --save
npm install mongoose --save
npm install cheerio --save
```

```js
var Yakuza   = require('yakuza');
var cheerio  = require('cheerio');
var mongoose = require('mongoose');
var Movie    = require('../app/models/movie');
var config   = require('../config/config');
mongoose.connect(config.db);
```

### Yakuza

#### Yakuza Basics
Yakuza is a scraping management system. There is four main concepts to remember `Scraper`, `Agent`, `Task`, and `Job`.

This is a the basic structure

--
- Scraper1
  - Agent1
    - Task1
    - Task2
  - Agent2
    - Task1
    - Task2
- Scraper2
  - Agent3
    - Task3

--
- Execute Job1
  - Scraper1 > Agent1 > Task1
  - Scraper1 > Agent1 > Task2
- Execute Job2
  - Scraper2 > Agent3 > Task3

--

`Scraper` refers to the name of the scraping project. For example: `"Movies"` and `"Financial Data"`

`Agent` refers to the name of the website where you will get the data from for that specific `Scraper`. For example: `"imdb"` and `"yahoo finance"`

`Task` refers to the name of an action for a specific `Agent`. For example: `"login"` and `"top250"`

`Job` refers to the actual execution of `Task/Tasks`

#### Define a Scraper

```js
Yakuza.scraper('movie');
```

#### Define an Agent

```js
Yakuza.agent('movie', 'imdb').plan(['top250']);
```

#### Define a Task

```js
Yakuza.task('movie', 'imdb', 'top250').main(function (task, http, params) {
  // your logic for retrieving the html and extrating data here
})
```

#### Define a Job

```js
var top250 = Yakuza.job('movie', 'imdb', {someParams: "someParams"}).enqueue('top250');

// when task is completed, do...
top250.on('task:top250:success', function (task) {
  var moviesList = task.data.moviesList;
  moviesList.forEach(function (movie) {
    saveMovie(movie);
  });
});

// actually execute the Job
top250.run();
```

#### Logic for Task

```js
Yakuza.task('movie', 'imdb', 'top250').main(function (task, http, params) {
  console.log(params) // {someParams: "someParams"}
  var url = 'http://www.imdb.com/chart/top?ref_=nv_mv_250_6';

  // Get the html document
  http.get(url, function (error, res, html){
    if (error) { return task.fail(error); } // required

    // your logic for extracting data

    return task.success({message: "Completed top250", moviesList: moviesList}); // required
  });
}).builder(function (job){
  // if you have passed in data to your job and you want to use it in your task, then you need to have this.
  return job.params;
}).hooks({
  // customize your promise upon completion of your task.
  onFail: function (task) {
    if (task.runs <= 5) {
      rerunTask(task);
    } else {
      console.log(task.error.code + " >>> FOR >>> ", task.params);
    }
  }
});
```

### Cheerio
Cheerio is a fast, flexible, and lean implementation of core jQuery designed specifically for the server.

This means that given a HTML document, you can now use jQuery and retrieve elements!

Since we are using Yakuza's `http` to send a request to retrieve our html, we can load the html with Cheerio

```js
Yakuza.task('movie', 'imdb', 'top250').main(function (task, http, params) {
  var url = 'http://www.imdb.com/chart/top?ref_=nv_mv_250_6';

  http.get(url, function (error, res, html){
    if (error) { return task.fail(error); }

    var $ = cheerio.load(html);
    var movies = $("tbody.lister-list > tr")
  ...
```

Since we got an array of movies with `$("tbody.lister-list > tr")` we can loop through movies and start extracting the data we need

```js
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
```

In the above code, we used `.each()` to iterate each element inside `movies`. Then use `.find()` to filter down to the elements we need for three pieces of information `img`, `title`, and `rating`.

For these three elements we would go deeper to extract the actual information we need by using the two most commonly used methods `.html()` and `attr()`. There are more methods you can use for different data such as `.css()` to get css specific attributes for an element. Basically you can use what you have learnt from jQuery lesson and apply them here.

--

Now that we have our data, recall that we need to pass it into our `task.success()` to complete our task before we can start saving the data? So idealy you should have the following code

```js
Yakuza.task('movie', 'imdb', 'top250').main(function (task, http, params) {
  var url = 'http://www.imdb.com/chart/top?ref_=nv_mv_250_6';

  http.get(url, function (error, res, html){
    if (error) { return task.fail(error); }

    $ = cheerio.load(html);
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
});
```

### Saving Data
Now that the task is completed, it will emit an event `task:top250:success`. Recall that before we `top250.run()`, we have a `top250.on('task:top250:success', function (task) {...` that will listen to the event and run a function that contains whatever you passed into `task.success()`. So now is a good time to actually save our data.

```js
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
```

# Highcharts

For highcharts, go read the documentations and look at the demos (code available in jsFiddle).

[Documentation](http://api.highcharts.com/highstock)
[Demos](http://www.highcharts.com/stock/demo)
