import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import { isSimplePassword } from '../utils/validators.js'; 
import { mergeGuestCart } from './cartController.js';
import { 
    sendSuccess, 
    sendError, 
    sendValidationError, 
    sendUnauthorized 
} from '../utils/responseHelper.js';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';

/**
 * Generate Access Token (ngắn hạn - 15 phút)
 */
function generateAccessToken(userId, username) {
    return jwt.sign(
        { id: userId, username: username }, 
        JWT_SECRET, 
        { expiresIn: '15m' }
    );
}

/**
 * Generate Refresh Token (dài hạn - 7 ngày)
 */
function generateRefreshToken(userId, username) {
    return jwt.sign(
        { id: userId, username: username }, 
        JWT_REFRESH_SECRET, 
        { expiresIn: '7d' }
    );
}

/**
 * Đăng ký tài khoản
 */
export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return sendValidationError(res, 'Vui lòng nhập đầy đủ thông tin');
        }

        const existingUser = await UserModel.findOne({ 
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return sendError(res, 2, 'Username hoặc email đã tồn tại');
        }

        if (isSimplePassword(password)) {
            return sendValidationError(res, 'Mật khẩu quá đơn giản. Cần ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new UserModel({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        return sendSuccess(
            res, 
            { 
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email
                }
            },
            'Đăng ký thành công',
            201
        );
    } catch (err) {
        next(err);
    }
};

/**
 * Đăng nhập
 */
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return sendValidationError(res, 'Vui lòng nhập đầy đủ thông tin');
        }

        const user = await UserModel.findOne({ username });

        if (!user) {
            return sendUnauthorized(res, 'Username không tồn tại');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return sendUnauthorized(res, 'Mật khẩu không chính xác');
        }

        const accessToken = generateAccessToken(user._id, user.username);
        const refreshToken = generateRefreshToken(user._id, user.username);

        req.user = user;
        await mergeGuestCart(req);

        return sendSuccess(res, {
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fullname: user.fullname,
                avatar: user.avatar
            }
        }, 'Đăng nhập thành công');
    } catch (err) {
        next(err);
    }
};

/**
 * Làm mới access token
 */
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return sendUnauthorized(res, 'Refresh token không được cung cấp');
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        
        const user = await UserModel.findById(decoded.id);
        if (!user) {
            return sendUnauthorized(res, 'User không tồn tại');
        }

        const newAccessToken = generateAccessToken(user._id, user.username);

        return sendSuccess(res, { accessToken: newAccessToken }, 'Làm mới token thành công');
    } catch (err) {
        return sendUnauthorized(res, 'Refresh token không hợp lệ');
    }
};

/**
 * Đăng xuất
 */
export const logout = async (req, res) => {
    return sendSuccess(res, {}, 'Đăng xuất thành công');
};

