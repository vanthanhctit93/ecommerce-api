import UserModel from '../models/User.js';
import bcrypt from 'bcryptjs';
import { isSimplePassword } from '../utils/validators.js'; 

/**
 * Lấy thông tin profile của user hiện tại
 * @route GET /user/profile
 * @access Private
 */
export const getProfile = async (req, res) => {
    try {
        // req.user đã được gán từ protect middleware
        const user = await UserModel.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Người dùng không tồn tại'
                }
            });
        }

        res.status(200).json({
            status_code: 1,
            data: {
                user
            }
        });
    } catch (err) {
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Cập nhật thông tin profile
 * @route PUT /user/profile
 * @access Private
 */
export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, age, gender, address, avatar } = req.body;

        const user = await UserModel.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Người dùng không tồn tại'
                }
            });
        }

        // Kiểm tra email mới có bị trùng không
        if (email && email !== user.email) {
            const emailExists = await UserModel.findOne({ email });
            if (emailExists) {
                return res.status(400).json({
                    status_code: 0,
                    data: {
                        error_code: 2,
                        message: 'Email đã được sử dụng'
                    }
                });
            }
        }

        // Cập nhật thông tin
        user.fullname = fullname || user.fullname;
        user.email = email || user.email;
        user.age = age || user.age;
        user.gender = gender || user.gender;
        user.address = address || user.address;
        user.avatar = avatar || user.avatar;

        await user.save();

        res.status(200).json({
            status_code: 1,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullname: user.fullname,
                    avatar: user.avatar,
                    age: user.age,
                    gender: user.gender,
                    address: user.address
                },
                message: 'Cập nhật profile thành công'
            }
        });
    } catch (err) {
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Đổi mật khẩu
 * @route PUT /user/change-password
 * @access Private
 */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Vui lòng nhập đầy đủ thông tin'
                }
            });
        }

        const user = await UserModel.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Người dùng không tồn tại'
                }
            });
        }

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Mật khẩu hiện tại không đúng'
                }
            });
        }

        // Kiểm tra mật khẩu mới có đủ mạnh không
        const isSimple = isSimplePassword(newPassword);
        if (isSimple) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 4,
                    message: 'Mật khẩu mới quá đơn giản'
                }
            });
        }

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();

        res.status(200).json({
            status_code: 1,
            data: {
                message: 'Đổi mật khẩu thành công'
            }
        });
    } catch (err) {
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Xóa tài khoản
 * @route DELETE /user/account
 * @access Private
 */
export const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Vui lòng nhập mật khẩu để xác nhận'
                }
            });
        }

        const user = await UserModel.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Người dùng không tồn tại'
                }
            });
        }

        // Xác thực mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Mật khẩu không đúng'
                }
            });
        }

        await user.deleteOne();

        res.status(200).json({
            status_code: 1,
            data: {
                message: 'Xóa tài khoản thành công'
            }
        });
    } catch (err) {
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};