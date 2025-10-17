import UserModel from '../models/User.js';
import bcrypt from 'bcryptjs';
import { isSimplePassword } from '../utils/validators.js';
// ✅ ADD IMPORT
import { 
    sendSuccess, 
    sendError, 
    sendNotFound, 
    sendValidationError, 
    sendServerError 
} from '../utils/responseHelper.js';

/**
 * Lấy thông tin profile
 */
export const getProfile = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id).select('-password');

        if (!user) {
            return sendNotFound(res, 'Người dùng không tồn tại');
        }

        return sendSuccess(res, { user });
    } catch (err) {
        return sendServerError(res);
    }
};

/**
 * Cập nhật profile
 */
export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, age, gender, address, avatar } = req.body;

        const user = await UserModel.findById(req.user._id);

        if (!user) {
            return sendNotFound(res, 'Người dùng không tồn tại');
        }

        if (email && email !== user.email) {
            const emailExists = await UserModel.findOne({ email });
            if (emailExists) {
                return sendError(res, 2, 'Email đã được sử dụng');
            }
        }

        user.fullname = fullname || user.fullname;
        user.email = email || user.email;
        user.age = age || user.age;
        user.gender = gender || user.gender;
        user.address = address || user.address;
        user.avatar = avatar || user.avatar;

        await user.save();

        return sendSuccess(res, {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fullname: user.fullname,
                avatar: user.avatar,
                age: user.age,
                gender: user.gender,
                address: user.address
            }
        }, 'Cập nhật profile thành công');
    } catch (err) {
        return sendServerError(res);
    }
};

/**
 * Đổi mật khẩu
 */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendValidationError(res, 'Vui lòng nhập đầy đủ thông tin');
        }

        const user = await UserModel.findById(req.user._id);

        if (!user) {
            return sendNotFound(res, 'Người dùng không tồn tại');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return sendError(res, 3, 'Mật khẩu hiện tại không đúng');
        }

        if (isSimplePassword(newPassword)) {
            return sendError(res, 4, 'Mật khẩu mới quá đơn giản');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();

        return sendSuccess(res, {}, 'Đổi mật khẩu thành công');
    } catch (err) {
        return sendServerError(res);
    }
};

/**
 * Xóa tài khoản
 */
export const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return sendValidationError(res, 'Vui lòng nhập mật khẩu để xác nhận');
        }

        const user = await UserModel.findById(req.user._id);

        if (!user) {
            return sendNotFound(res, 'Người dùng không tồn tại');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return sendError(res, 3, 'Mật khẩu không đúng');
        }

        await user.deleteOne();

        return sendSuccess(res, {}, 'Xóa tài khoản thành công');
    } catch (err) {
        return sendServerError(res);
    }
};