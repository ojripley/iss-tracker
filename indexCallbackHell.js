// requires and runs the main code
const { upcomingFlyoversInMyLocation } = require('./issSpotter');

upcomingFlyoversInMyLocation((error, flyoverTimes) => {
  if (!error) {
    console.log('The next fly over times for your location are:\n');
    for (let time of flyoverTimes) {
      console.log(time.risetime + ' for ' + time.duration + ' seconds.');
    }
  } else {
    console.log('error');
  }
});