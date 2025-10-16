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

/**
 * Calculate volumetric weight
 * @param {Object} dimensions - Package dimensions
 * @param {number} dimensions.length - Length (cm)
 * @param {number} dimensions.width - Width (cm)
 * @param {number} dimensions.height - Height (cm)
 * @param {number} conversionFactor - Default 6000 (Vietnam standard)
 * @returns {number} - Volumetric weight in kg
 */
export function calculateVolumetricWeight({ length, width, height }, conversionFactor = 6000) {
    return (length * width * height) / conversionFactor;
}

/**
 * Get chargeable weight (max of actual weight vs volumetric weight)
 * @param {number} actualWeight - Actual weight in kg
 * @param {Object} dimensions - Package dimensions
 * @returns {number} - Chargeable weight in kg
 */
export function getChargeableWeight(actualWeight, dimensions) {
    if (!dimensions) return actualWeight;
    
    const volumetricWeight = calculateVolumetricWeight(dimensions);
    return Math.max(actualWeight, volumetricWeight);
}

/**
 * Calculate distance-based shipping zone
 * @param {string} fromProvinceCode - Sender province code
 * @param {string} toProvinceCode - Receiver province code
 * @returns {string} - Zone type: 'same-province', 'neighboring', 'nationwide'
 */
export function calculateShippingZone(fromProvinceCode, toProvinceCode) {
    if (fromProvinceCode === toProvinceCode) {
        return 'same-province';
    }
    
    // Neighboring provinces mapping (example - can be extended)
    const neighboringProvinces = {
        '01': ['02', '11', '25'], // Hà Nội -> Hà Giang, Cao Bằng, Phú Thọ
        '79': ['77', '80', '82'], // TP.HCM -> Bà Rịa Vũng Tàu, Long An, Tiền Giang
        // Add more mappings based on your business logic
    };
    
    if (neighboringProvinces[fromProvinceCode]?.includes(toProvinceCode)) {
        return 'neighboring';
    }
    
    return 'nationwide';
}

/**
 * Advanced shipping cost calculation (similar to ViettelPost/GHTK)
 * @param {Object} params - Shipping parameters
 * @param {number} params.actualWeight - Actual weight in kg
 * @param {Object} params.dimensions - Package dimensions {length, width, height} in cm
 * @param {string} params.fromProvinceCode - Sender province code
 * @param {string} params.toProvinceCode - Receiver province code
 * @param {string} params.fromCommuneCode - Sender commune code
 * @param {string} params.toCommuneCode - Receiver commune code
 * @param {string} params.shippingMethod - 'standard' or 'express'
 * @param {number} params.codAmount - COD amount (optional)
 * @param {number} params.insuranceValue - Insurance value (optional)
 * @param {number} params.subtotal - Order subtotal for free shipping check
 * @returns {Object} - Detailed shipping cost breakdown
 */
export function calculateAdvancedShipping({
    actualWeight = 1,
    dimensions = null,
    fromProvinceCode,
    toProvinceCode,
    fromCommuneCode,
    toCommuneCode,
    shippingMethod = 'standard',
    codAmount = 0,
    insuranceValue = 0,
    subtotal = 0
}) {
    // 1. Free shipping check
    const FREE_SHIPPING_THRESHOLD = 500000;
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        return {
            totalCost: 0,
            breakdown: {
                baseCost: 0,
                weightSurcharge: 0,
                codFee: 0,
                insuranceFee: 0,
                vatFee: 0
            },
            method: shippingMethod === 'express' ? 'Giao hàng nhanh - Miễn phí' : 'Giao hàng tiêu chuẩn - Miễn phí',
            estimatedDays: shippingMethod === 'express' ? '1-2' : '3-5',
            isFree: true,
            chargeableWeight: 0
        };
    }

    // 2. Calculate chargeable weight
    const chargeableWeight = getChargeableWeight(actualWeight, dimensions);
    
    // 3. Determine shipping zone
    const zone = calculateShippingZone(fromProvinceCode, toProvinceCode);
    
    // 4. Base rates by zone and method
    const zoneRates = {
        'same-province': {
            standard: { base: 20000, perKg: 3000, firstKg: 1 },
            express: { base: 35000, perKg: 5000, firstKg: 1 }
        },
        'neighboring': {
            standard: { base: 30000, perKg: 4000, firstKg: 1 },
            express: { base: 55000, perKg: 7000, firstKg: 1 }
        },
        'nationwide': {
            standard: { base: 45000, perKg: 6000, firstKg: 1 },
            express: { base: 80000, perKg: 10000, firstKg: 1 }
        }
    };

    const rate = zoneRates[zone][shippingMethod];
    
    // 5. Calculate base cost with weight surcharge
    let baseCost = rate.base;
    let weightSurcharge = 0;
    
    if (chargeableWeight > rate.firstKg) {
        const extraWeight = Math.ceil(chargeableWeight - rate.firstKg);
        weightSurcharge = extraWeight * rate.perKg;
    }
    
    // 6. COD fee calculation (0.5% - 2% depending on amount and zone)
    let codFee = 0;
    if (codAmount > 0) {
        const codRate = zone === 'same-province' ? 0.005 : 0.015; // 0.5% or 1.5%
        const minCodFee = 5000; // Minimum 5k
        codFee = Math.max(codAmount * codRate, minCodFee);
    }
    
    // 7. Insurance fee (0.5% of declared value)
    let insuranceFee = 0;
    if (insuranceValue > 0) {
        insuranceFee = insuranceValue * 0.005; // 0.5%
    }
    
    // 8. Calculate subtotal before VAT
    const subtotalBeforeVat = baseCost + weightSurcharge + codFee + insuranceFee;
    
    // 9. VAT (10%)
    const vatFee = subtotalBeforeVat * 0.1;
    
    // 10. Total cost
    const totalCost = Math.round(subtotalBeforeVat + vatFee);
    
    return {
        totalCost,
        breakdown: {
            baseCost,
            weightSurcharge,
            codFee: Math.round(codFee),
            insuranceFee: Math.round(insuranceFee),
            vatFee: Math.round(vatFee)
        },
        method: shippingMethod === 'express' ? 'Giao hàng nhanh' : 'Giao hàng tiêu chuẩn',
        estimatedDays: shippingMethod === 'express' ? '1-2' : '3-5',
        isFree: false,
        chargeableWeight: Math.round(chargeableWeight * 100) / 100,
        zone,
        details: {
            actualWeight,
            volumetricWeight: dimensions ? Math.round(calculateVolumetricWeight(dimensions) * 100) / 100 : null
        }
    };
}