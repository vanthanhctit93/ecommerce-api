import nodemailer from 'nodemailer';

// Check if email credentials are configured
if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn('⚠️  WARNING: Email not configured (missing EMAIL_USER or EMAIL_APP_PASSWORD)');
}

// Create transporter
const transporter = process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    })
    : null;

// Test connection only if transporter exists
if (transporter) {
    transporter.verify((error, success) => {
        if (error) {
            console.log('❌ Email config error:', error);
        } else {
            console.log('✅ Email service ready');
        }
    });
}

export default transporter;