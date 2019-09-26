// requires and runs the main code
const { fetchIP, determineCoordinates } = require('./issSpotter');

// fetchIP((error, ip) => {
//   if (!error) {
//     return ip;
//   } else {
//     throw `\nSomething went wrong getting your IP address!\n\n ${error}`;
//   }
// });

// determineCoordinates('66.207.199.230', (error, coordinates) => {
//   if (!error) {
//     console.log(coordinates);
//   } else {
//     throw `\nSomething went wrong determining your location!\n\n ${error}`;
//   }
// });