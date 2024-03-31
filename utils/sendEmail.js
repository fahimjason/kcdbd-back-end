const nodemailer = require('nodemailer');
const fs = require('fs');

const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    let pdfAttachment = fs.readFileSync(`${process.env.FILE_UPLOAD_PATH}/invoices/${options.invoice}`);

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        html: options.htmlEmail,
        attachments: [
            {
                filename: options.invoice,
                content: pdfAttachment,
                encoding: 'base64'
            }
        ]
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
