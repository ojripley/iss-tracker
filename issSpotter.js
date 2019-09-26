// contains most of the logic for fetching data from the API endpoints

const request = require('request');

// returns the IP address of the network the user is on
// the callback needs to be passed the ip address (string), the error code and the response status code
const fetchIP = function(callback) {
  request('https://api.ipify.org/', (error, response, ip) => {
    
    // if there is an error, callback with error message and exit function
    // errors are likely to be invalid domain, user is offline
    if (error) {
      callback(error, null);
      return;
    }

    // made my own error message here in case of non 200 status code from server
    if (response.statusCode !== 200) {
      callback(`Server Error!\nStatus Code: ${response.statusCode}`, null);
    } else {
      // if all goes well, callback with the data and no error
      callback(null, ip);
    }
  });
};

const determineCoordinates = function(ip, callback) {
  request('https://ipvigilante.com/' + ip, (error, response, data) => {
    
    if (error) {
      callback(error, null);
      return;
    }

    if (response.statusCode !== 200) {
      callback(`Server Error!\nStatus Code: ${response.statusCode}`, null);
    } else {
      // parse the JSON text into an object
      const coordInfo = JSON.parse(data);
      // extract only the latitude and longitude key/value pairs and make a new object out of them
      const coordinates = {
        latitude: coordInfo.data.latitude,
        longitude: coordInfo.data.longitude
      };
      // 'coordinates' is now an object with two keys: latitude and longitude
      callback(null, coordinates);
    }
  });
};

module.exports = { fetchIP, determineCoordinates };