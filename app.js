require('dotenv').config();
require('module-alias/register');
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('@/config/db');
const errorHandler = require('@/middlewares/errorMiddleware');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 8000;

app.use((req, res, next) => {
    req.io = io;
    next();
});

// Connect to MongoDB
connectDB();

app.use(express.json());
app.use(helmet());
app.use(cors());

// giới hạn request
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
}));

// Middleware
app.use(express.urlencoded({ 
    extended: true 
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './src/public', 'index.html'));
});

// Routes
app.use('/', require('@/routes/index'));
app.use('/auth', require('@/routes/auth'));
app.use('/poll', require('@/routes/poll'));
//app.use('/post', require('@/routes/post'));
//app.use('/product', require('@/routes/product'));


io.on('connection', (socket) => {
    console.log('Client connected: ', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected: ', socket.id);
    });

    socket.on('joinPoll', (pollId) => {
        socket.join(pollId);
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});