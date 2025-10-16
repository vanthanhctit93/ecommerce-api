import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import { isSimplePassword } from '../utils/validators.js'; 
import { mergeGuestCart } from './cartController.js';

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
 * @route POST /auth/register
 * @access Public
 */
export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Vui lòng nhập đầy đủ thông tin' 
                }
            });
        }

        const existingUser = await UserModel.findOne({ 
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Username hoặc email đã tồn tại' 
                }
            });
        }

        // Sử dụng isSimplePassword từ utils
        if (isSimplePassword(password)) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Mật khẩu quá đơn giản. Cần ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.' 
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

        res.status(201).json({ 
            status_code: 1,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email
                },
                message: 'Đăng ký thành công',
            } 
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Đăng nhập
 * @route POST /auth/login
 * @access Public
 */
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Vui lòng nhập đầy đủ thông tin' 
                }
            });
        }

        const user = await UserModel.findOne({ username });

        if (!user) {
            return res.status(401).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Username không tồn tại' 
                }
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ 
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Mật khẩu không chính xác' 
                }
            });
        }

        const accessToken = generateAccessToken(user._id, user.username);
        const refreshToken = generateRefreshToken(user._id, user.username);

        // Gán user vào req để merge cart
        req.user = user;

        // Merge guest cart với user cart
        await mergeGuestCart(req);

        res.status(200).json({
            status_code: 1, 
            data: { 
                accessToken,
                refreshToken,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullname: user.fullname,
                    avatar: user.avatar
                },
                message: 'Đăng nhập thành công', 
            },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Làm mới access token
 * @route POST /auth/refresh-token
 * @access Public
 */
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Refresh token không được cung cấp'
                }
            });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        
        // Kiểm tra user còn tồn tại không
        const user = await UserModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'User không tồn tại'
                }
            });
        }

        const newAccessToken = generateAccessToken(user._id, user.username);

        res.status(200).json({
            status_code: 1,
            data: {
                accessToken: newAccessToken,
                message: 'Làm mới token thành công'
            }
        });
    } catch (err) {
        res.status(401).json({
            status_code: 0,
            data: {
                error_code: 3,
                message: 'Refresh token không hợp lệ'
            }
        });
    }
};

/**
 * Đăng xuất
 * @route POST /auth/logout
 * @access Private
 */
export const logout = async (req, res) => {
    res.status(200).json({
        status_code: 1,
        data: {
            message: 'Đăng xuất thành công'
        }
    });
};

