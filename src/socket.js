import { Server as socketIO } from 'socket.io';
import http from 'http';
import app from './app.js';

const server = http.createServer(app);
const io = new socketIO(server);

io.on('connection', (socket) => {
    console.log('Client connected: ', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected: ', socket.id);
    });
});

export default io;