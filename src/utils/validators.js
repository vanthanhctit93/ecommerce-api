// ✅ IMPORT CONSTANTS
import { REGEX } from '../constants/index.js';

/**
 * Check if password is simple
 */
export function isSimplePassword(password) {
    return !(
        password.length >= REGEX.PASSWORD.MIN_LENGTH && 
        REGEX.PASSWORD.HAS_NUMBER.test(password) && 
        REGEX.PASSWORD.HAS_SPECIAL_CHAR.test(password) && 
        REGEX.PASSWORD.HAS_UPPERCASE.test(password) && 
        REGEX.PASSWORD.HAS_LOWERCASE.test(password)
    );
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    return REGEX.EMAIL.test(email);
}

/**
 * Validate username
 */
export function isValidUsername(username) {
    return REGEX.USERNAME.test(username);
}

/**
 * Validate SKU format
 */
export function isValidSKU(sku) {
    return REGEX.SKU.test(sku);
}

/**
 * Validate phone number (Vietnam)
 */
export function isValidPhone(phone) {
    return REGEX.PHONE_VN.test(phone);
}

/**
 * Sanitize string
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