const dgram = require('dgram');

let client = dgram.createSocket('udp4');
let server = dgram.createSocket('udp4');

server.on('message', (message) => {
    process.stdout.write('UDP String: ' + message + '\n');
    process.exit();

}).bind(2222, () => {
    const address = server.address();
    
    console.log(address);
});

server.on('listening', () => {
    const address = server.address();

    console.log(`Server listening ${address.address}:${address.port}`);
})

server.bind(2222, () => {
    server.addMembership('127.0.0.1');
});

client.send('Hello World', 0, 7, 2222, 'localhost');