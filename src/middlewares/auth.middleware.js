const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '';
// const asyncHandler = require('express-async-handler');
// const UserModel = require('../models/user');

module.exports = (req, res, next) => {
    const authHeader = req.headers('Authorization');

    if (!authHeader) {
        return res.status(401).json({ 
            message: 'Access denied. No token provided' 
        });
    }

    const token = authHeader.replace('Bearer ', '');

    try{
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            message: 'Invalid token' 
        });
    }
};