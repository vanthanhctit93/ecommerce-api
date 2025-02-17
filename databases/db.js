const Mongoose = require('mongoose');
const localDB = `mongodb://localhost:3000/auth`;

const connectDB = async () => {
    await Mongoose.connect(localDB, {
        useNewUrlParsers: true,
        useUnifiedTopology: true,
    });
}

module.exports = connectDB;