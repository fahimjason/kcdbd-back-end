const moment = require('moment-timezone');

module.exports.checkTimeExpiration = (time) => {
    const currentDateTime = moment.tz(process.env.TIME_ZONE);
    return moment.tz(time, process.env.TIME_ZONE).isBefore(currentDateTime);
}

// Function to format date as per Asia/Dhaka timezone in a human-readable format
module.exports.formatDateAsDhaka = () => {
    const options = { timeZone: 'Asia/Dhaka', hour12: false };
    return new Date().toLocaleString('en-US', options);
}