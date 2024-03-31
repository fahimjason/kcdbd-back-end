const path = require('path');
const fs = require('fs');

const ErrorLog = require('../models/ErrorLog');
const ErrorResponse = require('../utils/errorResponse'); 
const { formatDateAsDhaka } = require('../utils/time');

// Create a writable stream for error logs
const errorLogStream = fs.createWriteStream(
    path.join(path.dirname(__dirname), 'error.log'),
    { flags: 'a' }
);

const errorHandler = async (err, req, res, next) => {
    // Log timestamp in server time (UTC) and in "Asia/Dhaka" time zone
    const serverTimestamp = new Date().toISOString();
    const dhakaTimestamp = formatDateAsDhaka();
    const errorMessage = err.stack;

    // Log the error message to the error log stream with timestamps
    if(process.env.NODE_ENV === 'production') {
        errorLogStream.write(`Server Time (UTC): ${serverTimestamp} | Dhaka Time: ${dhakaTimestamp}\n`);
        errorLogStream.write(`${errorMessage}\n`);

        const errorLog = new ErrorLog({
            timestamp_utc: serverTimestamp,
            timestamp_dhaka: dhakaTimestamp,
            error_message: errorMessage
        });
        
        await errorLog.save();
    }

    let error = { ...err };

    error.message = err.message;

    // Log to console for dev
    console.log(err.stack.red);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found`;
        error = new ErrorResponse(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new ErrorResponse(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
}

module.exports = errorHandler;