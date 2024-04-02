const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Load models
const User = require('./models/User');
const Ticket = require('./models/Ticket');
const Coupon = require('./models/Coupon');
const Workshop = require('./models/Workshop');

// Connect to DB
mongoose.connect(process.env.MONGO_URI_PROD, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Read JSON files
const users = JSON.parse(
    fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8')
);

const tickets = JSON.parse(
    fs.readFileSync(`${__dirname}/_data/tickets.json`, 'utf-8')
);

const coupons = JSON.parse(
    fs.readFileSync(`${__dirname}/_data/coupons.json`, 'utf-8')
);

const workshops = JSON.parse(
    fs.readFileSync(`${__dirname}/_data/workshops.json`, 'utf-8')
);

// Import into DB
const importData = async () => {
    try {
        await User.create(users);
        await Ticket.create(tickets);
        await Coupon.create(coupons);
        await Workshop.create(workshops);
        console.log('Data Imported...'.green.inverse);
        process.exit();
    } catch (err) {
        console.error(err);
    }
};

// Delete data
const deleteData = async () => {
    try {
        await User.deleteMany();
        await Ticket.deleteMany();
        await Coupon.deleteMany();
        await Workshop.deleteMany();
        console.log('Data Destroyed...'.red.inverse);
        process.exit();
    } catch (err) {
        console.error(err);
    }
};

if (process.argv[2] === '-i') {
    importData();
} else if (process.argv[2] === '-d') {
    deleteData();
}
