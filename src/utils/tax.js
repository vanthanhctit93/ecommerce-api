/**
 * Calculate tax (VAT) based on subtotal
 * @param {Object} params - Tax parameters
 * @param {number} params.subtotal - Cart subtotal
 * @param {string} params.country - Country code
 * @param {boolean} params.isBusiness - Is business customer
 * @returns {Object} - { amount, rate, breakdown }
 */
export function calculateTax({ subtotal, country = 'VN', isBusiness = false }) {
    // Tax rates by country
    const taxRates = {
        'VN': 0.10,  // 10% VAT (Vietnam)
        'US': 0.07,  // 7% Sales Tax (average)
        'UK': 0.20,  // 20% VAT
        'SG': 0.08,  // 8% GST (Singapore)
        'TH': 0.07   // 7% VAT (Thailand)
    };

    const taxRate = taxRates[country.toUpperCase()] || taxRates['VN'];

    // Business customers may be tax exempt
    if (isBusiness && country === 'VN') {
        return {
            amount: 0,
            rate: taxRate,
            isExempt: true,
            breakdown: {
                subtotal,
                taxableAmount: 0,
                taxRate,
                reason: 'Doanh nghiệp có mã số thuế'
            }
        };
    }

    // Calculate tax
    const taxAmount = Math.round(subtotal * taxRate);

    return {
        amount: taxAmount,
        rate: taxRate,
        isExempt: false,
        breakdown: {
            subtotal,
            taxableAmount: subtotal,
            taxRate,
            taxAmount
        }
    };
}

/**
 * Get tax information for a country
 * @param {string} country - Country code
 * @returns {Object} - Tax info
 */
export function getTaxInfo(country = 'VN') {
    const taxInfo = {
        'VN': {
            name: 'VAT',
            fullName: 'Thuế giá trị gia tăng',
            rate: 0.10,
            description: '10% VAT áp dụng cho hầu hết hàng hóa và dịch vụ'
        },
        'US': {
            name: 'Sales Tax',
            fullName: 'Sales Tax',
            rate: 0.07,
            description: 'Varies by state (average 7%)'
        },
        'UK': {
            name: 'VAT',
            fullName: 'Value Added Tax',
            rate: 0.20,
            description: '20% VAT on most goods and services'
        },
        'SG': {
            name: 'GST',
            fullName: 'Goods and Services Tax',
            rate: 0.08,
            description: '8% GST on most goods and services'
        },
        'TH': {
            name: 'VAT',
            fullName: 'Value Added Tax',
            rate: 0.07,
            description: '7% VAT on most goods and services'
        }
    };

    return taxInfo[country.toUpperCase()] || taxInfo['VN'];
}

/**
 * Format tax display string
 * @param {Object} taxData - Tax calculation result
 * @returns {string} - Formatted string
 */
export function formatTaxDisplay(taxData) {
    if (taxData.isExempt) {
        return 'Miễn thuế';
    }
    
    const percentage = (taxData.rate * 100).toFixed(0);
    return `${taxData.breakdown.taxAmount.toLocaleString('vi-VN')} ₫ (${percentage}%)`;
}