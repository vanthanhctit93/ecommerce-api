const dgram = require('dgram');

const socket = dgram.createSocket('udp4');

socket.on('error', (error) => {

});

socket.on('message', (message, rinfo) => {

})

socket.on('listening', () => {

})

socket.on('close', () => {

})