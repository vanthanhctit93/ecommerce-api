//const express = require('express');
//const router = express.Router();
//const { protect } = require('@/middlewares/auth.middleware');

///**
// * Creates a new user instance.
// *
// * @param {Object} userDetails - The details of the new user.
// * @param {string} userDetails.username - The username of the new user.
// * @param {string} userDetails.email - The email address of the new user.
// * @param {string} userDetails.password - The hashed password of the new user.
// * @returns {User} The newly created user instance.
// */
//router.post('/register', async (req, res) => {
//    try {
//        const { username, email, password } = req.body;

//        // Kiểm tra xem người dùng đã tồn tại chưa (theo username hoặc email)
//        const existingUser = await User.findOne({ $or: { username: username, email: email } });

//        if (existingUser) {
//            return res.status(400).json({ message: 'Username hoặc email đã tồn tại' });
//        }

//        // Mã hóa mật khẩu bằng bcrypt (sử dụng saltRounds là 10)
//        const saltRounds = 10;
//        const hashedPassword = await bcrypt.hash(password, saltRounds);

//        // Tạo mới đối tượng User và lưu vào CSDL
//        const newUser = new User({
//            username,
//            email,
//            password: hashedPassword
//        });

//        await newUser.save();

//        res.status(200).json({ message: 'Đăng ký thành công' });
//    } catch (error) {
//        console.log(error);
//    }
//});

//module.exports = router;