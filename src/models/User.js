import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [false, 'Please add a name'],
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

    timestamps: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);

export default User;