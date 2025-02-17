const UserModel = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '';

function isSimplePassword(password) {
    const minLength = 12;
    const hasNumber = /\d/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
    const hasUpperCase = /[A-Z]/;
    const hasLowerCase = /[a-z]/;

    return password.length >= minLength && hasNumber.test(password) && hasSpecialChar.test(password) && hasUpperCase.test(password) && hasLowerCase.test(password);
}

const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(200).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Vui lòng nhập đầy đủ thông tin' 
                }
            });
        }

        const existingUser = await UserModel.findOne({ 
            $or: [
                { username },
                { email }
            ]
        });

        if (existingUser) {
            return res.status(200).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Username hoặc email đã tồn tại' 
                }
            });
        }

        if (isSimplePassword(password)) {
            return res.status(200).json({ 
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Mật khẩu quá đơn giản' 
                }
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new UserModel({
            username,
            email,
            password: hashedPassword
        });

        await user.save();
        res.status(200).json({ 
            status_code: 1,
            data: {
                user,
                message: 'Đăng ký thành công',
            } 
        });
    } catch (err) {
        next(err);
    }
}

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await UserModel.findOne({ username });

        if (!user) {
            return res.status(400).json({ message: 'Username không tồn tại' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không chính xác' });
        }

        // check password simple


        const token = jwt.sign({ id: user._id, user: user.username }, JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json({ token });
    } catch (err) {
        next(err);
    }
}

module.exports = { register, login };
