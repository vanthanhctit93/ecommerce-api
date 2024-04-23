const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
        },

        email: {
            type: String,
            required: [true, 'Please add a email'],
            unique: true
        },

        password: {
            type: String,
            required: [true, 'Please add a password'],
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