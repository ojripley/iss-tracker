// requires and runs the main code
const { fetchIP } = require('./issSpotter');

fetchIP((error, ip) => {
  if (!error) {
    console.log(ip);
    return ip;
  } else {
    console.log('Something went wrong' + error);
  }
});