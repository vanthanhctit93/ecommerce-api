import axios from 'axios';
import { 
    getLocalProvinces, 
    getLocalCommunesByProvince, 
    validateLocalAddress 
} from './localAddressService.js';

const ADDRESS_API_BASE = 'https://production.cas.so/address-kit/2025-07-01';
const USE_LOCAL_DATA = process.env.USE_LOCAL_ADDRESS_DATA === 'true'; // Thêm vào .env

/**
 * Fetch provinces (fallback to API if local fails)
 */
export async function getProvinces() {
    if (USE_LOCAL_DATA) {
        try {
            return await getLocalProvinces();
        } catch (error) {
            console.warn('Local data failed, falling back to API');
        }
    }
    
    try {
        const response = await axios.get(`${ADDRESS_API_BASE}/provinces`);
        return response.data;
    } catch (error) {
        console.error('Error fetching provinces:', error);
        throw new Error('Không thể tải danh sách tỉnh/thành phố');
    }
}

/**
 * Fetch communes by province (fallback to API if local fails)
 */
export async function getCommunesByProvince(provinceId) {
    if (USE_LOCAL_DATA) {
        try {
            return await getLocalCommunesByProvince(provinceId);
        } catch (error) {
            console.warn('Local data failed, falling back to API');
        }
    }
    
    try {
        const response = await axios.get(`${ADDRESS_API_BASE}/provinces/${provinceId}/communes`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching communes for province ${provinceId}:`, error);
        throw new Error('Không thể tải danh sách xã/phường');
    }
}

/**
 * Fetch all communes
 * @returns {Promise<Array>} - List of all communes
 */
export async function getAllCommunes() {
    try {
        const response = await axios.get(`${ADDRESS_API_BASE}/communes`);
        return response.data;
    } catch (error) {
        console.error('Error fetching all communes:', error);
        throw new Error('Không thể tải danh sách xã/phường');
    }
}

/**
 * Validate address (use local data if available)
 */
export async function validateAndParseAddress(address) {
    if (USE_LOCAL_DATA) {
        try {
            return await validateLocalAddress(address);
        } catch (error) {
            console.warn('Local validation failed, falling back to API');
        }
    }
    
    const errors = [];
    
    if (!address.fullName) errors.push('Tên người nhận không được để trống');
    if (!address.phone) errors.push('Số điện thoại không được để trống');
    if (!address.address) errors.push('Địa chỉ không được để trống');
    if (!address.provinceCode) errors.push('Mã tỉnh/thành không được để trống');
    if (!address.communeCode) errors.push('Mã xã/phường không được để trống');

    if (errors.length > 0) {
        return {
            valid: false,
            errors
        };
    }

    try {
        // Fetch province and commune data to validate
        const provinces = await getProvinces();
        const province = provinces.find(p => p.code === address.provinceCode);
        
        if (!province) {
            errors.push('Mã tỉnh/thành không hợp lệ');
            return { valid: false, errors };
        }

        const communes = await getCommunesByProvince(address.provinceCode);
        const commune = communes.find(c => c.code === address.communeCode);
        
        if (!commune) {
            errors.push('Mã xã/phường không hợp lệ');
            return { valid: false, errors };
        }

        return {
            valid: true,
            errors: [],
            parsedAddress: {
                ...address,
                provinceName: province.name,
                communeName: commune.name,
                fullAddress: `${address.address}, ${commune.name}, ${province.name}`
            }
        };
    } catch (error) {
        errors.push('Lỗi khi xác thực địa chỉ');
        return { valid: false, errors };
    }
}