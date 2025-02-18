import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import asyncHandler from 'express-async-handler';
import UserModel from '../models/User';

const gennerateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d'});
}

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);

        throw new Error('Please add all fields !');
    }

    const userExists = await UserModel.findOne({ email });

    if (userExists) {
        res.status(400);

        throw new Error('User already exists !');
    }

    const salt = await bcrypt.getSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await UserModel.create({
        name,
        email,
        password: hashedPassword,
    })

    if (user) {
        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            token: gennerateToken(user.id)
        })
    } else {
        res.status(400);

        throw new Error('Invalid user data');
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || password) {
        res.status(400);

        throw new Error('Please add all fields');
    }

    const user = await UserModel.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))){
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            token: gennerateToken(user.id)
        })
    } else {
        res.status(400);

        throw new Error('Invalid credentials');
    }
});

const getLoggedInUser = asyncHandler(async (req, res) => {
    const {id, name, email } = await UserModel.findById(req.user.id);

    res.status(200).json({
        id: id,
        name,
        email
    })
})