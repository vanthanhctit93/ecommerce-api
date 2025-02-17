const express = require('express');
const {body} = require('express-validator');
const authController = require('../controllers/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/register', 
    [
        body('username').not().isEmpty().trim().escape().withMessage('Username không được để trống'),
        body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
        body('password').isLength({min: 6}).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    ],
    validate,
    authController.register
);

router.post('/login',
    [
        body('username').not().isEmpty().trim().escape().withMessage('Username không được để trống'),
        body('password').isLength({min: 6}).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    ],
    validate,
    authController.login
);

module.exports = router;