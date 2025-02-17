const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            unique: true,
            required: [true, 'Please add a username']
        },

        password: {
            type: String,
            bcrypt: true,
            required: [true, 'Please add a password'],
        },

        email: {
            type: String,
            unique: true,
            required: [true, 'Please add a email']
        },

        name: {
            type: String,
            required: [true, 'Please add a name'],
        },

        avatar: {
            type: String,
        },

        age: {
            type: Number,
        },

        gender: {
            type: String,
        },

        address: {
            type: String,
        },
    }, 
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);