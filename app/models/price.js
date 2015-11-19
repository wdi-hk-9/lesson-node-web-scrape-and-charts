var mongoose = require('mongoose');

var price = new mongoose.Schema({
  date:    { type: Date, require: true, unique: true},
  dateStr: { type: String, require: true, unique: true},
  open:    { type: Number, require: true},
  high:    { type: Number, require: true},
  low:     { type: Number, require: true},
  close:   { type: Number, require: true},
  volumn:  { type: Number, require: true},
  symbol:  { type: String, require: true}
});

var Price = mongoose.model('Price', price);

module.exports = Price;