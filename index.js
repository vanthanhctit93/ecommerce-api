const http = require('http');
const app = require('./src/app');

app.set('port', 3000);

const server = http.createServer(app);

server.listen(3000);