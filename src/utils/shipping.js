/**
 * Calculate shipping cost based on various factors
 * @param {Object} params - Shipping parameters
 * @param {number} params.subtotal - Cart subtotal amount
 * @param {number} params.weight - Total weight (kg)
 * @param {string} params.location - Delivery location code
 * @param {string} params.shippingMethod - Shipping method (standard/express)
 * @returns {Object} - { cost, method, estimatedDays }
 */
export function calculateShipping({ subtotal, weight = 0, location = 'default', shippingMethod = 'standard' }) {
    // 1. Free shipping threshold
    const FREE_SHIPPING_THRESHOLD = 500000; // 500k VND
    
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        return {
            cost: 0,
            method: 'Miễn phí vận chuyển',
            estimatedDays: shippingMethod === 'express' ? '1-2' : '3-5',
            isFree: true
        };
    }

    // 2. Base rates by location
    const locationRates = {
        'hanoi': {
            standard: 25000,
            express: 50000
        },
        'hcm': {
            standard: 25000,
            express: 50000
        },
        'danang': {
            standard: 30000,
            express: 60000
        },
        'remote': {
            standard: 50000,
            express: 100000
        },
        'default': {
            standard: 30000,
            express: 60000
        }
    };

    const rates = locationRates[location.toLowerCase()] || locationRates['default'];
    let baseCost = rates[shippingMethod] || rates['standard'];

    // 3. Weight surcharge (per kg over 1kg)
    const WEIGHT_THRESHOLD = 1; // kg
    const WEIGHT_SURCHARGE = 5000; // 5k per kg
    
    if (weight > WEIGHT_THRESHOLD) {
        const extraWeight = Math.ceil(weight - WEIGHT_THRESHOLD);
        baseCost += extraWeight * WEIGHT_SURCHARGE;
    }

    // 4. Express shipping multiplier
    const estimatedDays = shippingMethod === 'express' ? '1-2' : '3-5';

    return {
        cost: baseCost,
        method: shippingMethod === 'express' ? 'Giao hàng nhanh' : 'Giao hàng tiêu chuẩn',
        estimatedDays,
        isFree: false,
        breakdown: {
            baseCost: rates[shippingMethod],
            weightSurcharge: weight > WEIGHT_THRESHOLD ? (Math.ceil(weight - WEIGHT_THRESHOLD) * WEIGHT_SURCHARGE) : 0
        }
    };
}

/**
 * Get available shipping methods for a location
 * @param {string} location - Delivery location
 * @returns {Array} - Available shipping methods
 */
export function getAvailableShippingMethods(location = 'default') {
    const methods = [
        {
            id: 'standard',
            name: 'Giao hàng tiêu chuẩn',
            description: '3-5 ngày làm việc',
            available: true
        },
        {
            id: 'express',
            name: 'Giao hàng nhanh',
            description: '1-2 ngày làm việc',
            available: location !== 'remote' // Express không có ở vùng xa
        }
    ];

    return methods.filter(m => m.available);
}

/**
 * Validate shipping address
 * @param {Object} address - Shipping address
 * @returns {Object} - { valid, errors, location }
 */
export function validateShippingAddress(address) {
    const errors = [];
    
    if (!address.fullName) errors.push('Tên người nhận không được để trống');
    if (!address.phone) errors.push('Số điện thoại không được để trống');
    if (!address.address) errors.push('Địa chỉ không được để trống');
    if (!address.city) errors.push('Thành phố không được để trống');

    // Detect location based on city
    let location = 'default';
    if (address.city) {
        const city = address.city.toLowerCase();
        if (city.includes('hà nội') || city.includes('hanoi')) {
            location = 'hanoi';
        } else if (city.includes('hồ chí minh') || city.includes('hcm') || city.includes('saigon')) {
            location = 'hcm';
        } else if (city.includes('đà nẵng') || city.includes('danang')) {
            location = 'danang';
        } else {
            // Check if remote location (can add more logic)
            location = 'default';
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        location
    };
}