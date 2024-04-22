const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const cone = await mongoose.connect(process.env.MONGO_URL);

        console.log(`Mongo db connected: ${cone.connection.host}`);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

module.exports = connectDB;