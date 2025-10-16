import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import UserModel from '../models/User.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Lấy user từ DB (không lấy password)
            req.user = await UserModel.findById(decoded.id).select('-password');
            
            if (!req.user) {
                res.status(401);
                throw new Error('User not found');
            }
            
            next();
        } catch (error) {
            console.error('Auth error:', error.message);
            res.status(401);
            throw new Error('Not Authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not Authorized, no token');
    }
});

export { protect };