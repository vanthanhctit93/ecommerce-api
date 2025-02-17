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

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (isSimplePassword(password)) {
            return res.status(400).json({ message: 'Mật khẩu quá đơn giản' });
        }

        const existingUser = await UserModel.findOne({ 
            $or: [
                { username },
                { email }
            ]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username hoặc email đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await UserModel.create({
            username,
            email,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (err) {
        next(err);
    }
}

exports.loginUser = async (req, res, next) => {
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
