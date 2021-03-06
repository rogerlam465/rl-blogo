var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var expressSanitizer = require('express-sanitizer');
var methodOverride = require('method-override');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var User = require("./models/user");
var Blogpost = require("./models/blogpost");

var app = express();

// configure passport

app.use(require('express-session')({
  secret: "apple grove elephant masticate down freezer",
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

// I still don't know what this does.

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// initialize various libraries

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
// Apparently, this is to serve static files from within Express.
app.use(express.static("public"));
// I would assume that this is the indicator to method-override to kick in.
app.use(methodOverride("_method"));
app.use(expressSanitizer());

app.use(express.static('public'));

// Mongo told me to use those two parameters, but I don't know what their use implies.

mongoose.connect("mongodb://localhost/blogo", { useUnifiedTopology: true, useNewUrlParser: true });

// ===== ROUTES BEGIN =====

// index page
// this page displays blog posts

// ideally it would display the first 25, and then offer the next ones in sequence

app.get("/", function (req, res) {
  Blogpost.find({}).sort('-date').exec(function (err, foundPosts) {
    if (err) {
      console.log(err);
    } else {
      res.render("index", { data: foundPosts });
    };
  });
});

// list of posts
// this page should display a list of previous blog posts
// ideally it would list them by date, then by title

app.get("/posts", function (req, res) {
  var query = Blogpost.find({}).select('title dateString date').sort('-date');

  query.exec(function (err, allPostTitles) {
    if (err) {
      console.log(err);
    } else {
      res.render("posts", { data: allPostTitles })
    }
  });
});

// display one particular blog post

app.get("/p/:id", function (req, res) {
  Blogpost.findById(req.params.id, function (err, foundPost) {
    if (err) {
      console.log(err);
    } else {
      res.render("singlepost", { item: foundPost });
    }
  });
});

// new blog post page

app.get("/new", function (req, res) {
  res.render("new");
});

// edit blog post page

app.get("/p/:id/edit", function (req, res) {
  Blogpost.findById(req.params.id, function (err, foundPost) {
    if (err) {
      console.log(err);
      res.redirect("/p/" + req.params.id);
    } else {
      res.render("edit", { data: foundPost });
    };
  });
});

// update route

app.put("/p/:id", function (req, res) {
  req.body.data.body = req.sanitize(req.body.data.body);
  Blogpost.findByIdAndUpdate(req.params.id, req.body.data, function (err, updatedPost) {
    if (err) {
      console.log(err);
      res.redirect("/p/" + updatedPost._id);
    } else {
      res.redirect("/p/" + updatedPost._id);
    }
  })
});

// confirm delete blog post page

app.get("/d/:id", function (req, res) {
  var id = req.params.id;
  Blogpost.findById(id, function (err, foundPost) {
    if (err) {
      console.log(err);
    } else {
      res.render("delete", { item: foundPost });
    }
  })
});

// actual delete blog post route

app.delete("/d/:id", function (req, res) {
  console.log(req.params.id);
  Blogpost.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/p/" + req.params.id);
    } else {
      res.redirect("/");
    }
  })
});

// create blog post
// grab data from form, pop it into the DB

app.post("/", function (req, res) {
  // populate the fields we'll insert into the DB
  var title = req.body.title;
  var body = req.body.body;

  // grab current date

  // I seem to recall that Mongo does funky things with the date. So.

  var newDate = new Date();

  // construct the date in string format, adding zeros as necessary to single digit returns

  function addZero(date) {
    if (date < 10) {
      return "0" + date;
    } else {
      return date;
    }
  }

  var dateString = newDate.getFullYear() + "/" + newDate.getMonth() + "/" + newDate.getDate() + " - " + addZero(newDate.getHours()) + ":" + addZero(newDate.getMinutes());
  console.log(dateString);
  var newPost = { title: title, body: body, dateString: dateString };
  // Create a new blog post in the db
  Blogpost.create(newPost, function (err, newlyCreated) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  })
});

// ===== AUTH ROUTES =====

// login link

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", passport.authenticate("local",
  {
    successRedirect: "/",
    failureRedirect: "/login"
  }));

// register link

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  let newUser = new User({ username: req.body.username });
  User.register(newUser, req.body.password, function (err, user) {
    console.log("in User callback");
    if (err) {
      console.log(err);
      return res.render('register');
    }
    passport.authenticate("local")(req, res, function () {
      res.redirect("/");
    });
  });
});

// catchall route

app.get("*", function (req, res) {
  res.send("You don't have to go home, but you can't stay here.");
});

app.listen(3000, function () {
  console.log("Blogo started.");
});
