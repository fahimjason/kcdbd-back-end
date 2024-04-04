const AWS = require('aws-sdk');

// Configure AWS with your credentials
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

exports.uploadToS3 = async (params, next) => {
    try {
        const data = await s3.upload(params).promise();

        return data;
    } catch (err) {
        console.error(err);
        next(new ErrorResponse(`Problem with file upload`, 500));
    }
};

exports.removeFromS3 = async (params, next) => {
    try {
        const data = await s3.deleteObject(params).promise();
        console.log(`${params.Key} deleted successfully`);
        return data;
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.readFromS3 = async (params) => {
    try {
        const data = await s3.getObject(params).promise();
        return data.Body;
    } catch (error) {
        console.error("Error reading from S3:", error);
        throw error;
    }
};