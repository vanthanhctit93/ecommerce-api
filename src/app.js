import dotenv from 'dotenv';
dotenv.config();

import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import bodyParser from 'body-parser';
import router from './routes/index.js';
import { Server as SocketIO } from 'socket.io';
import connectDB from './config/db.js';
import errorHandler from './middlewares/errorMiddleware.js';

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);
const PORT = process.env.PORT || 8000;

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use(express.json());
app.use(helmet());
app.use(cors());

// giới hạn request
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 3600000,
    },
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ 
    extended: true 
}));
app.use(express.json());

// Routes
app.use('/', router);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});