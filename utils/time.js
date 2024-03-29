const moment = require('moment-timezone');

module.exports.checkTimeExpiration = (time) => {
    const currentDateTime = moment.tz(process.env.TIME_ZONE);
    return moment.tz(time, process.env.TIME_ZONE).isBefore(currentDateTime);
}