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
import RedisStore from 'connect-redis';
import bodyParser from 'body-parser';
import { Server as SocketIO } from 'socket.io';
import redis, { isRedisAvailable } from './config/redis.js';
import router from './routes/index.js';
import connectDB from './config/db.js';
import errorHandler from './middlewares/errorMiddleware.js';
import { startArticleScheduler, stopArticleScheduler } from './jobs/articleScheduler.js';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import timeout from 'connect-timeout';

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

// ========================================
// SECURITY MIDDLEWARE
// ========================================

// 1. Helmet - Set security headers
app.use(helmet());

// 2. CORS - Cross-Origin Resource Sharing
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// 3. XSS Protection - Clean user input from malicious scripts
app.use(xss());

// 4. NoSQL Injection Protection - Sanitize data against query injection
app.use(mongoSanitize({
    replaceWith: '_', // Replace $ and . with _
    onSanitize: ({ req, key }) => {
        console.warn(`⚠️  Sanitized key: ${key} in request from ${req.ip}`);
    }
}));

// 5. Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Quá nhiều requests từ IP này, vui lòng thử lại sau.',
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// 6. Request Timeout - Prevent hanging requests
app.use(timeout('30s'));
app.use((req, res, next) => {
    if (!req.timedout) next();
});

// 7. Compression - Compress response bodies
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6 // Compression level (0-9)
}));

// 8. Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session - Use Redis if available, fallback to MongoDB
const sessionStore = isRedisAvailable()
    ? new RedisStore({ 
        client: redis,
        prefix: 'sess:',
        ttl: 3600 // 1 hour
    })
    : MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
        collectionName: 'sessions',
        ttl: 60 * 60 // 1 hour
    });

if (isRedisAvailable()) {
    console.log('✅ Using Redis for session storage');
} else {
    console.log('⚠️  Using MongoDB for session storage (Redis not available)');
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 3600000, // 1 hour
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