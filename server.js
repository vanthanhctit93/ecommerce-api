require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');

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

app.use(express.urlencoded(
    { 
        extended: false 
    }
));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('api/', require('./routes/index'));
app.use('api/user', require('./routes/user'));
app.use('api/poll', require('./routes/poll'));
app.use('api/post', require('./routes/post'));
app.use('api/product', require('./routes/product'));


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

app.listen(port, () => {
    console.log(`Server started on port ${PORT}`);
});