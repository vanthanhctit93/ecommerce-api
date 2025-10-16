/**
 * Kiểm tra mật khẩu có đơn giản không
 * 
 * Mật khẩu được coi là MẠNH khi đáp ứng TẤT CẢ các điều kiện:
 * - Ít nhất 8 ký tự
 * - Có ít nhất 1 chữ số (0-9)
 * - Có ít nhất 1 ký tự đặc biệt (!@#$%^&*(),.?":{}|<>)
 * - Có ít nhất 1 chữ hoa (A-Z)
 * - Có ít nhất 1 chữ thường (a-z)
 * 
 * @param {string} password - Mật khẩu cần kiểm tra
 * @returns {boolean} - Trả về `true` nếu mật khẩu ĐƠN GIẢN, `false` nếu mật khẩu MẠNH
 * 
 * @example
 * isSimplePassword('abc123'); // true (thiếu chữ hoa, ký tự đặc biệt)
 * isSimplePassword('Abc@1234'); // false (mật khẩu mạnh)
 */
export function isSimplePassword(password) {
    const minLength = 8;
    const hasNumber = /\d/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
    const hasUpperCase = /[A-Z]/;
    const hasLowerCase = /[a-z]/;

    // Trả về TRUE nếu mật khẩu ĐƠN GIẢN (thiếu bất kỳ điều kiện nào)
    return !(
        password.length >= minLength && 
        hasNumber.test(password) && 
        hasSpecialChar.test(password) && 
        hasUpperCase.test(password) && 
        hasLowerCase.test(password)
    );
}

/**
 * Validate email format
 * @param {string} email - Email cần kiểm tra
 * @returns {boolean} - true nếu email hợp lệ
 * 
 * @example
 * isValidEmail('test@example.com'); // true
 * isValidEmail('invalid-email'); // false
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate username (chỉ cho phép alphanumeric và underscore, 3-20 ký tự)
 * @param {string} username - Username cần kiểm tra
 * @returns {boolean} - true nếu username hợp lệ
 * 
 * @example
 * isValidUsername('john_doe'); // true
 * isValidUsername('ab'); // false (quá ngắn)
 * isValidUsername('user@name'); // false (có ký tự không hợp lệ)
 */
export function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
}

/**
 * Sanitize string để tránh XSS
 * @param {string} str - String cần sanitize
 * @returns {string} - String đã được làm sạch
 */
export function sanitizeString(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}