import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data/addresses');

// Cache để tránh đọc file nhiều lần
let cachedProvinces = null;
let cachedCommunes = null;
let cachedMapping = null;

/**
 * Load provinces from local JSON file
 */
export async function getLocalProvinces() {
    if (cachedProvinces) return cachedProvinces;
    
    try {
        const filePath = path.join(DATA_DIR, 'provinces.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        cachedProvinces = parsed.provinces;
        return cachedProvinces;
    } catch (error) {
        console.error('Error loading provinces:', error.message);
        throw new Error('Không thể tải dữ liệu tỉnh/thành phố');
    }
}

/**
 * Load all communes from local JSON file
 */
export async function getLocalCommunes() {
    if (cachedCommunes) return cachedCommunes;
    
    try {
        const filePath = path.join(DATA_DIR, 'communes.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        cachedCommunes = parsed.communes;
        return cachedCommunes;
    } catch (error) {
        console.error('Error loading communes:', error.message);
        throw new Error('Không thể tải dữ liệu xã/phường');
    }
}

/**
 * Load province-commune mapping
 */
export async function getLocalMapping() {
    if (cachedMapping) return cachedMapping;
    
    try {
        const filePath = path.join(DATA_DIR, 'province-commune-mapping.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        cachedMapping = parsed.mapping;
        return cachedMapping;
    } catch (error) {
        console.error('Error loading mapping:', error.message);
        throw new Error('Không thể tải dữ liệu mapping');
    }
}

/**
 * Get communes by province code
 */
export async function getLocalCommunesByProvince(provinceCode) {
    const mapping = await getLocalMapping();
    return mapping[provinceCode] || [];
}

/**
 * Find province by code
 */
export async function findProvinceByCode(code) {
    const provinces = await getLocalProvinces();
    return provinces.find(p => p.code === code);
}

/**
 * Find commune by code
 */
export async function findCommuneByCode(code) {
    const communes = await getLocalCommunes();
    return communes.find(c => c.code === code);
}

/**
 * Search provinces by name
 */
export async function searchProvinces(query) {
    const provinces = await getLocalProvinces();
    const lowerQuery = query.toLowerCase();
    
    return provinces.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(lowerQuery))
    );
}

/**
 * Search communes by name
 */
export async function searchCommunes(query, provinceCode = null) {
    let communes = await getLocalCommunes();
    
    if (provinceCode) {
        communes = communes.filter(c => c.provinceCode === provinceCode);
    }
    
    const lowerQuery = query.toLowerCase();
    
    return communes.filter(c => 
        c.name.toLowerCase().includes(lowerQuery) ||
        (c.nameEn && c.nameEn.toLowerCase().includes(lowerQuery))
    );
}

/**
 * Validate address with local data
 */
export async function validateLocalAddress(address) {
    const errors = [];
    
    if (!address.fullName) errors.push('Tên người nhận không được để trống');
    if (!address.phone) errors.push('Số điện thoại không được để trống');
    if (!address.address) errors.push('Địa chỉ không được để trống');
    if (!address.provinceCode) errors.push('Mã tỉnh/thành không được để trống');
    if (!address.communeCode) errors.push('Mã xã/phường không được để trống');

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    try {
        const province = await findProvinceByCode(address.provinceCode);
        if (!province) {
            errors.push('Mã tỉnh/thành không hợp lệ');
            return { valid: false, errors };
        }

        const commune = await findCommuneByCode(address.communeCode);
        if (!commune || commune.provinceCode !== address.provinceCode) {
            errors.push('Mã xã/phường không hợp lệ hoặc không thuộc tỉnh/thành đã chọn');
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

/**
 * Clear cache (useful for hot reload)
 */
export function clearCache() {
    cachedProvinces = null;
    cachedCommunes = null;
    cachedMapping = null;
}