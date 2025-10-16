import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// Test connection
transporter.verify((error, success) => {
    if (error) {
        console.log('Email config error:', error);
    } else {
        console.log('Email service ready');
    }
});

export default transporter;