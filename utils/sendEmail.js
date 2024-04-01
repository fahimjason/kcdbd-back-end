const nodemailer = require('nodemailer');
const fs = require('fs');

const ErrorResponse = require('../utils/errorResponse');

const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    // const  pdfAttachment = fs.readFileSync(`${process.env.FILE_UPLOAD_PATH}/invoices/${options.invoice}`);

    // const message = {
    //     from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    //     to: options.email,
    //     subject: options.subject,
    //     html: options.htmlEmail,
    //     attachments: [
    //         {
    //             filename: options.invoice,
    //             content: pdfAttachment,
    //             encoding: 'base64'
    //         }
    //     ]
    // };

    // const info = await transporter.sendMail(message);

    // console.log('Message sent: %s', info.messageId);

    try {
        // Retry logic with a short delay
        const MAX_RETRIES = 3;
        let retries = 0;
        let pdfAttachment;
        while (retries < MAX_RETRIES) {
            try {
                pdfAttachment = fs.readFileSync(`${process.env.FILE_UPLOAD_PATH}/invoices/${options.invoice}`);
                break; // Exit loop if file reading is successful
            } catch (error) {
                retries++;
                console.error(`Error reading file (Attempt ${retries}):`, error);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
            }
        }

        if (!pdfAttachment) {
            return new ErrorResponse(`Failed to read PDF file: ${options.invoice}`);
        }

        const base64Pdf = pdfAttachment.toString('base64');

        const message = {
            from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            html: options.htmlEmail,
            attachments: [
                {
                    filename: options.invoice,
                    content: base64Pdf,
                    encoding: 'base64'
                }
            ]
        };

        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = sendEmail;
