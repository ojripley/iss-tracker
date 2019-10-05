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
const fetchFlyOverTimes = function(coordinates) {
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
const upcomingFlyoversInMyLocation = function() {
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
      console.log('The next fly over times for your location are:\n');
      for (let time of flyOverTimes) {
        console.log(Date(Number(time.risetime) * 1000) + ' for ' + time.duration + ' seconds.');
      }
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

module.exports = { upcomingFlyoversInMyLocation };