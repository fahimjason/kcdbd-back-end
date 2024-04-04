const path = require('path');
const ErrorResponse = require('./errorResponse');

exports.fileUploader = (req, id, next) => {
    const file = req.files.file;

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    // Check filesize
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
            new ErrorResponse(
                `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
                400
            )
        );
    }

    // Create custom filename
    file.name = `photo_${id}${path.parse(file.name).ext}`;

    return file;
};

// Function to get ContentType based on file extension
exports.getContentType = (filePath) => {
    const extname = path.extname(filePath).toLowerCase();
    switch (extname) {
        case '.pdf':
            return 'application/pdf';
        
        default:
            return 'application/octet-stream'; // Default to binary data
    }
};