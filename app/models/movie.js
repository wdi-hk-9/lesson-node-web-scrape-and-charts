var mongoose = require('mongoose');

var movie = new mongoose.Schema({
  title: { type: String, required: true, unique: true},
  rating: String,
  img: String
});

var Movie = mongoose.model('Movie', movie);

module.exports = Movie;