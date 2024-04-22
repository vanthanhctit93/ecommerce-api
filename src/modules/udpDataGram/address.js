// Node.js program to demonstrate the
// server.address() method

// importing dgram module
const dgram = require('dgram');

// Creating and initializing client and server socket
let client = dgram.createSocket('udp4');
let server = dgram.createSocket('udp4');

// Catching the massage event
server.on('message', (message) => {
    // Displaying the client message
    process.stdout.write('UDP String: ' + message + '\n');
    
    // Exiting process
    process.exit();

}).bind(2222, () => {
    // Getting the address infomation for the serverby using address() method
    const address = server.address();
    
    // Display the result
    console.log(address);
});

// Client sending massage to server
client.send('Hello World', 0, 7, 2222, 'localhost');
//{ address: '0.0.0.0', family: 'IPv4', port: 1234 }
//UDP String: Hello

//Example 2
// Catching the massage event
server.on('message', (message) => {
    // Displaying the client message
    process.stdout.write('UDP String: ' + message + '\n');
    
    // Exiting process
    process.exit();

}).bind(2222, () => {
    // Getting the address infomation for the serverby using address() method
    const address = server.address();
    
    // Display the result
    console.log(address);
});

server.on('listening', () => {
    const address = server.address();

    console.log(`Server listening ${address.address}:${address.port}`);
})

// Bingding server with port address
server.bind(2222, () => {

    // Adding a multicasst address for others to join
    server.addMembership('127.0.0.1');
});

// Client sending massage to server
client.send('Hello World', 0, 7, 2222, 'localhost');

//server listening 0.0.0.0:1234
//UDP String: Hello