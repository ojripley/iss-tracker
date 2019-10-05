//
//
//
//
//  iss tracker
//
//  Created September October 5, 2019
//  Last updated October 5, 2019
//
//
//
//  Owen Ripley
//
//  github: ojripley
//  email: ojripley19@gmail.com
//
//
//



// constants set up
const express = require('express');
const sessionCookie = require('cookie-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const { upcomingFlyoversInMyLocation } = require('./issSpotter');
const {
  generateRandomString,
  authenticate,
  fetchUserByEmail,
  isLoggedIn
} = require('./helperFunctions');
const app = express();
const PORT = 8080;

// app setup
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(sessionCookie({signed: false}));
app.use(methodOverride('_method'));



// ------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------------------



// temporary database set up (stored in objects for now instead of a real database)
// this means that the database will reset to default whenever the server is shut down

const users = {
  "ojr": {
    id: "ojr",
    email: "o@m.com",
    password: bcrypt.hashSync('p', 10)
  },
  // "user2RandomID": {
  //   id: "user2RandomID",
  //   email: "user2@example.com",
  //   password: "dishwasher-funk"
  // }
};



// ------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------------------



// listen function
app.listen(PORT, () => {
  console.log(`app is listening on port: ${PORT}`);
});



// ------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------------------



//   /////////////////////////////
//   // get requests follow below
//   // (route definition)
//   /////////////////////////////

// get request handlers
app.get('/', (req, res) => {

  // if user is logged in, redirects to /urls
  if (!req.session.userID) {
    console.log('login first!');
    res.redirect('/login');
  } else {
    res.render('index', {user: users[req.session.userID], msg: null});
  }
});


app.get('/login', (req, res) => {
  
  console.log(req.session.userID);

  if (req.session.userID) {
    res.redirect('/');
  } else {
    res.render('login', {msg: null});
  }
});


app.get('/register', (req, res) => {
  if (req.session.userID) {
    res.redirect('/');
  } else {
    res.render('register', {msg: null});
  }
});

app.get('/flyovers', (req, res) => {
  if (req.session.userID) {
    upcomingFlyoversInMyLocation(users[req.session.userID], res);
  } else {
    res.redirect('login');
  }
});

// ------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------------------



//   /////////////////////////////
//   // post requests follow below
//   /////////////////////////////


app.post('/login', (req, res) => {
  
  const reqBody = req.body;
  const user = authenticate(reqBody, users);

  console.log('\n\nuser after authentication: ', user);

  if (user) {
    req.session.userID = user.id; // this is a session cookie set
    res.redirect('/');
    return;
  } else {
    res.status(403).render('login', { msg: 'Incorrect Login Credentials. The ISS has launched a nuclear space missle to your location. Call your loved ones.'});
  }
});


app.post('/logout', (req, res) => {
  
  console.log('\nlogging out the user', req.session.userID);

  // delete session cookie by setting it to null
  req.session.userID = null;
  res.redirect('/login');
});


app.post('/register', (req, res) => {

  if (!fetchUserByEmail(req.body.email, users)) {
    // if user email does not already exist
    if (req.body.password.length === 0 || req.body.email.length === 0) {
      // res.status(403).render('register', { msg: 'Incorrect Login Credentials. The ISS has launched a nuclear space missle to your location. Call your loved ones.'});
      // res.send('Fields cannot be empty!');
    } else {
      // new user object
      const newUserID = generateRandomString(3);
      users[newUserID] = {
        id: newUserID,
        email: req.body.email,
        // pass word is stored as an hash key, with saltRounds: 10
        password: bcrypt.hashSync(req.body.password, 10)
      };

      // set userID cookie and redirect to users' urls
      req.session.userID = users[newUserID].id;
      res.redirect('/');
    }
  } else {
    res.status(403).render('register', {msg: 'An account with that email already exists. Get original!'});
  }
});


// ------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------------------

