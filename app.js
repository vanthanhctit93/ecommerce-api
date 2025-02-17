const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const routes = require('./routes/index');
//const errorHandler = require('./middleware/errorMiddleware');

dotenv.config()

const PORT = process.env.PORT || 8000;
const MODE = process.env.NODE_ENV;
const URL = process.env.MONGODB_URL;

const app = express();

mongoose.connect(URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => {
    console.log('Mongo db connected successfully');
}).catch(err => {
    console.log(err);
});

app.use(express.json());
app.use(express.urlencoded({ 
    extended: false 
}));

app.use('/', routes);

//app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});