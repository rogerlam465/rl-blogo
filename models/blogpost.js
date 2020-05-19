let mongoose = require('mongoose');

var blogSchema = new mongoose.Schema({
    title: String,
    body: String,
    dateString: String,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Blogpost", blogSchema);