import mongoose from 'mongoose';

const AuthSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a email'],
        unique: true
    },

    password: {
        type: String,
        required: [true, 'Please add a password'],
    },

    timestamps: {
        type: Date,
        default: Date.now
    }
});

const Auth = mongoose.model('Auth', AuthSchema);

export default Auth;