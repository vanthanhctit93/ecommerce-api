import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import { isSimplePassword } from '../utils/validators.js'; 
import { mergeGuestCart } from './cartController.js';
import { 
    sendSuccess, 
    sendError, 
    sendValidationError,
    sendServerError 
} from '../utils/responseHelper.js';

// ✅ IMPORT CONSTANTS
import {
    ERROR_MESSAGES,
    ERROR_CODE,
    TIME,
    HTTP_STATUS
} from '../constants/index.js';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';

/**
 * Generate Access Token
 */
function generateAccessToken(userId, username) {
    return jwt.sign(
        { id: userId, username: username }, 
        JWT_SECRET, 
        { expiresIn: TIME.JWT_ACCESS_EXPIRY }
    );
}

/**
 * Generate Refresh Token
 */
function generateRefreshToken(userId, username) {
    return jwt.sign(
        { id: userId, username: username }, 
        JWT_REFRESH_SECRET, 
        { expiresIn: TIME.JWT_REFRESH_EXPIRY }
    );
}

/**
 * Register
 */
export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return sendValidationError(res, ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
        }

        const existingUser = await UserModel.findOne({ 
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(HTTP_STATUS.CONFLICT).json({ 
                status_code: 0,
                data: {
                    error_code: ERROR_CODE.DUPLICATE_ERROR,
                    message: ERROR_MESSAGES.DUPLICATE_USERNAME_EMAIL
                }
            });
        }

        if (isSimplePassword(password)) {
            return sendValidationError(res, ERROR_MESSAGES.PASSWORD_TOO_SIMPLE);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new UserModel({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        return sendSuccess(res, {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        }, 'Đăng ký thành công', HTTP_STATUS.CREATED);
    } catch (err) {
        next(err);
    }
};

/**
 * Login
 */
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return sendValidationError(res, ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
        }

        const user = await UserModel.findOne({ username });

        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
                status_code: 0,
                data: {
                    error_code: ERROR_CODE.UNAUTHORIZED,
                    message: ERROR_MESSAGES.INVALID_CREDENTIALS
                }
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
                status_code: 0,
                data: {
                    error_code: ERROR_CODE.UNAUTHORIZED,
                    message: ERROR_MESSAGES.INVALID_CREDENTIALS
                }
            });
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

