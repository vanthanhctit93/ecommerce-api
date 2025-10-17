import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bodyParser from 'body-parser';
import { Server as SocketIO } from 'socket.io';
import router from './routes/index.js';
import connectDB from './config/db.js';
import errorHandler from './middlewares/errorMiddleware.js';
import { startArticleScheduler, stopArticleScheduler } from './jobs/articleScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

// START CRON JOBS
// if (process.env.NODE_ENV !== 'test') {
//     startArticleScheduler();
// }

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);
const PORT = process.env.PORT || 8000;

// Socket.IO middleware
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Giới hạn 100 requests
    message: 'Quá nhiều requests từ IP này, vui lòng thử lại sau.'
}));

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
        collectionName: 'sessions',
        ttl: 60 * 60 // 1 hour
    }),
    cookie: {
        maxAge: 3600000, // 1 giờ
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // HTTPS only in production
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Serve uploads folder

// Routes
app.use('/', router);

// Error handler (phải để cuối cùng)
app.use(errorHandler);

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGINT', () => {
    console.log('\n Shutting down gracefully...');
    stopArticleScheduler();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n SIGTERM received, shutting down...');
    stopArticleScheduler();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;