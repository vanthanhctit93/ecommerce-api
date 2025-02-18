import jwt from'jsonwebtoken';
import asyncHandler from'express-async-handler';
import UserModel from'../models/User';

const protect = asyncHandler(async (req, res) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await UserModel.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.log(error);

            res.status(401);

            throw new Error('Not Authorized');
        }
    }

    if (!token) {
        res.status(401);

        throw new Error('Not Authorized, no token');
    }
});

module.exports = { protect };