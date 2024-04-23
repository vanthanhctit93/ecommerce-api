const express = require('express');
const errorHandler = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');

const port = 3000;
const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ 
    extended: false 
}));

app.use('/api', require('./routes/index'));

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});