if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsmate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const PORT = process.env.PORT || 8080;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log("MongoDB Connection Error:", err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsmate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});


// app.get("/demouser", async (req, res) => {
//   let fakeUser = new User({
//     email: "student@gmail.com",
//     username: "delta_student"
//   })

//   let registeredUser =  await User.register(fakeUser, "helloworld");
//   res.send(registeredUser);
// });

// app.get("/", (req, res) => {
//   res.send("Hi, I am root");
// });

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.log("Error Details:", {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack
  });
  
  let { statusCode = 500, message = "Something went wrong!" } = err;
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }
  
  // Handle Mongoose CastError (invalid ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Handle User registration errors
  if (err.name === 'UserExistsError') {
    statusCode = 400;
    message = "A user with the given username is already registered";
  }
  
  // For user registration errors, redirect back to signup with error message
  if (req.originalUrl === '/signup') {
    req.flash("error", message);
    return res.redirect("/signup");
  }
  
  res.status(statusCode).render("error.ejs", { err: { message, statusCode, stack: err.stack } });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log("Unhandled Rejection:", err);
});

// Modified server start
const server = app.listen(PORT)
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is already in use. Please try a different port or close the application using this port.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  })
  .on('listening', () => {
    console.log(`Server is listening on port ${PORT}`);
  });