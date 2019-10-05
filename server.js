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
const issSpotter = require('./issSpotter');
const {
  generateRandomString,
  authenticate,
  fetchUserURLs,
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

const flyoverTimes = issSpotter.upcomingFlyoversInMyLocation();

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

  console.log(flyoverTimes);

  // if user is logged in, redirects to /urls
  if (!req.session.userID) {
    console.log('login first!');
    res.redirect('/login');
  } else {
    res.render('index', {user: users[req.session.userID]});
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
    res.redirect('/urls');
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


// contains most of the logic for fetching data from the API endpoints

const request = require('request-promise-native');

// returns the IP address of the network the user is on if the promise is resolved
const fetchIP = function() {

  return new Promise((resolve, reject) => {
    request('https://api.ipify.org/', (error, response, ip) => {

      // if there is an error, return the promise back as a reject with the error message
      // errors are likely to be invalid domain, user is offline
      if (error) {
        reject(error);
      }

      // made my own error message here in case of non 200 status code from server
      if (response.statusCode !== 200) {
        // reject statements can be used all over the place for different scenarios that produce different errors
        reject(`Server Error!\nStatus Code: ${response.statusCode}`);
      } else {

        // if all goes well, the promise is resolved with the data and no error
        resolve(ip);
      }
    });
  });
};

// uses the users IP address to determine their coordinates. Returns them via a resolved promise.
const determineCoordinates = function(ip) {
  return new Promise((resolve, reject) => {
    request('https://ipvigilante.com/' + ip, (error, response, data) => {

      if (error) {
        reject(error);
      }

      if (response.statusCode !== 200) {
        reject(`Server Error!\nStatus Code: ${response.statusCode}`);
      } else {

        // parse the JSON text into an object
        const coordInfo = JSON.parse(data);

        // extract only the latitude and longitude key/value pairs and make a new object out of them
        // this is called 'Object Destructuring'. Way more powerful than the commented out code below
        const { latitude, longitude } = coordInfo.data;
        // const coordinates = {
        //   latitude: coordInfo.data.latitude,
        //   longitude: coordInfo.data.longitude
        // };

        // 'coordinates' is now an object with two keys: latitude and longitude
        resolve({ latitude, longitude });
      }
    });
  });
};

// passes latitude and longitude coordinates to an api that respondes with upcoming flyover times of the ISS
const fetchFlyOverTimes = function (coordinates) {
  return new Promise((resolve, reject) => {
    request(`http://api.open-notify.org/iss-pass.json?lat=${coordinates.latitude}&lon=${coordinates.longitude}`, (error, response, body) => {

      if (error) {
        reject(error);
      }

      if (response.statusCode !== 200) {
        reject(`Server Error!\nStatus Code: ${response.statusCode}`);
      } else {
        const flyOverTimes = JSON.parse(body).response;

        resolve(flyOverTimes);
      }
    });
  });
};

// this is the preferable way of doing things
// much easier to read promises that are linerally organized and not nested
const upcomingFlyoversInMyLocation = function (user, res) {
  // assign promise object
  const fetchIpPromise = fetchIP();

  // upon resolution
  fetchIpPromise
    .then((ip) => {
      return determineCoordinates(ip);
    })

    // when/if fetchIpPromise is resolved
    .then((coordinates) => {
      return fetchFlyOverTimes(coordinates);
    })

    // when/if determineCoordinatesPromise has been resolved
    .then((flyOverTimes) => {

      const data = [];

      console.log('The next fly over times for your location are:\n');
      for (let time of flyOverTimes) {
        data.push(Date(Number(time.risetime) * 1000) + ' for ' + time.duration + ' seconds.');
      }
      res.render('flyovers', { user: user, data: data });
      console.log(data);
    })

    // catch any rejected promises
    .catch((error) => {
      console.log(error);
    });
};



// hard to read nested version that i dont like

// const upcomingFlyoversInMyLocation = function() {
//   const fetchIpPromise = fetchIP();

//   fetchIpPromise
//     .then((ip) => {
//       const determineCoordinatesPromise = determineCoordinates(ip);
//       determineCoordinatesPromise.then((coordinates) => {
//         const fetchFlyOverTimesPromise = fetchFlyOverTimes(coordinates);
//         fetchFlyOverTimesPromise.then((flyOverTimes) => {
//           for (let time in flyOverTimes) {
//             flyOverTimes[time].risetime = Date(time.risetime);
//           }
//           console.log('The next fly over times for your location are:\n');
//           for (let time of flyOverTimes) {
//             console.log(time.risetime + ' for ' + time.duration + ' seconds.');
//           }
//         });
//       });
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// };
