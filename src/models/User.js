const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        fullname: {
            type: String,
            required: [true, 'Please add a name'],
        },

        email: {
            type: String,
            required: [true, 'Please add a email'],
            unique: true
        },

        username: {
            type: String,
            required: [true, 'Please add a username'],
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

userSchema.pre('save', (next) => {
    let user = this

    bcrypt.hash(user.password, 10, (err, hash) => {
        user.password = hash;
        next();
    })
});

const User = mongoose.model('User', userSchema);
module.exports = User;