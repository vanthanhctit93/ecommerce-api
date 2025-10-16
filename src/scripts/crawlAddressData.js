import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://production.cas.so/address-kit/2025-07-01';

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch with error handling and response inspection
 */
async function fetchWithLogging(url, description) {
    try {
        console.log(`📡 Fetching ${description}...`);
        console.log(`   URL: ${url}`);
        
        const response = await axios.get(url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                'Accept': 'application/json'
            }
        });
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Response type: ${typeof response.data}`);
        console.log(`   Is Array: ${Array.isArray(response.data)}`);
        
        if (!response.data) {
            console.log(`   ⚠️  No data in response`);
            return [];
        }

        // Log response structure
        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
            console.log(`   Keys:`, Object.keys(response.data));
        }

        // CHECK ORDER MATTERS! Check specific keys first
        
        // 1. Check for 'provinces' key
        if (response.data.provinces && Array.isArray(response.data.provinces)) {
            console.log(`   ✅ Found ${response.data.provinces.length} items in provinces property`);
            return response.data.provinces;
        }
        
        // 2. Check for 'communes' key
        if (response.data.communes && Array.isArray(response.data.communes)) {
            console.log(`   ✅ Found ${response.data.communes.length} items in communes property`);
            return response.data.communes;
        }
        
        // 3. Check if response.data itself is an array
        if (Array.isArray(response.data)) {
            console.log(`   ✅ Found ${response.data.length} items (direct array)`);
            return response.data;
        }
        
        // 4. Check for 'data' property
        if (response.data.data && Array.isArray(response.data.data)) {
            console.log(`   ✅ Found ${response.data.data.length} items in data property`);
            return response.data.data;
        }
        
        // 5. Other common structures
        if (response.data.results && Array.isArray(response.data.results)) {
            console.log(`   ✅ Found ${response.data.results.length} items in results property`);
            return response.data.results;
        }
        
        if (response.data.items && Array.isArray(response.data.items)) {
            console.log(`   ✅ Found ${response.data.items.length} items in items property`);
            return response.data.items;
        }
        
        console.log(`   ⚠️  Unexpected response structure - no array found`);
        console.log(`   Sample:`, JSON.stringify(response.data).substring(0, 300));
        return [];
        
    } catch (error) {
        console.error(`❌ Error fetching ${description}:`);
        console.error(`   Message: ${error.message}`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
        }
        throw error;
    }
}

async function fetchProvinces() {
    return await fetchWithLogging(`${BASE_URL}/provinces`, 'provinces');
}

async function fetchCommunesForProvince(provinceCode) {
    try {
        return await fetchWithLogging(
            `${BASE_URL}/provinces/${provinceCode}/communes`,
            `communes for province ${provinceCode}`
        );
    } catch (error) {
        console.error(`❌ Skipping province ${provinceCode}`);
        return [];
    }
}

async function fetchAllCommunes() {
    return await fetchWithLogging(`${BASE_URL}/communes`, 'all communes');
}

async function crawlAddressData() {
    console.log('🚀 Starting address data crawl...\n');
    const startTime = Date.now();
    
    try {
        // 1. Fetch provinces
        let provinces = await fetchProvinces();
        await delay(1000);
        
        if (!provinces || provinces.length === 0) {
            throw new Error('No provinces data received');
        }
        
        console.log(`✅ Successfully fetched ${provinces.length} provinces\n`);
        
        // 2. Fetch all communes
        let allCommunes = [];
        try {
            allCommunes = await fetchAllCommunes();
            await delay(1000);
            console.log(`✅ Successfully fetched ${allCommunes.length} communes\n`);
        } catch (error) {
            console.log('⚠️  All communes endpoint failed, fetching by province...\n');
        }
        
        // 3. Fallback: fetch by province
        if (!allCommunes || allCommunes.length === 0) {
            console.log('📋 Fetching communes by province...\n');
            allCommunes = [];
            
            for (let i = 0; i < provinces.length; i++) {
                const province = provinces[i];
                console.log(`[${i + 1}/${provinces.length}] ${province.name}...`);
                
                try {
                    const communes = await fetchCommunesForProvince(province.code);
                    allCommunes.push(...communes);
                    console.log(`   ✅ ${communes.length} communes`);
                } catch (error) {
                    console.log(`   ⚠️  Skipped`);
                }
                
                await delay(500);
            }
            
            console.log(`\n✅ Total: ${allCommunes.length} communes\n`);
        }
        
        // 4. Normalize data
        provinces = provinces.map(p => ({
            code: p.code,
            name: p.name,
            nameEn: p.englishName || '',
            administrativeLevel: p.administrativeLevel || '',
            fullName: p.name,
            fullNameEn: p.englishName || ''
        }));
        
        allCommunes = allCommunes.map(c => ({
            code: c.code,
            name: c.name,
            nameEn: c.englishName || '',
            administrativeLevel: c.administrativeLevel || '',
            fullName: c.name,
            fullNameEn: c.englishName || '',
            provinceCode: c.provinceCode || ''
        }));
        
        // 5. Group by province
        const communesByProvince = {};
        allCommunes.forEach(commune => {
            const code = commune.provinceCode;
            if (code) {
                if (!communesByProvince[code]) communesByProvince[code] = [];
                communesByProvince[code].push(commune);
            }
        });
        
        // 6. Build complete data
        const completeData = {
            metadata: {
                crawledAt: new Date().toISOString(),
                totalProvinces: provinces.length,
                totalCommunes: allCommunes.length,
                source: BASE_URL,
                version: '2025-07-01'
            },
            provinces: provinces.map(p => ({
                ...p,
                communesCount: (communesByProvince[p.code] || []).length,
                communes: communesByProvince[p.code] || []
            })),
            allCommunes
        };
        
        // 7. Save files
        const dataDir = path.join(__dirname, '../../data/addresses');
        await fs.mkdir(dataDir, { recursive: true });
        
        await fs.writeFile(
            path.join(dataDir, 'vietnam-addresses-complete.json'),
            JSON.stringify(completeData, null, 2),
            'utf-8'
        );
        console.log(`✅ Complete data saved`);
        
        await fs.writeFile(
            path.join(dataDir, 'provinces.json'),
            JSON.stringify({ metadata: completeData.metadata, provinces }, null, 2),
            'utf-8'
        );
        console.log(`✅ Provinces saved`);
        
        await fs.writeFile(
            path.join(dataDir, 'communes.json'),
            JSON.stringify({ metadata: completeData.metadata, communes: allCommunes }, null, 2),
            'utf-8'
        );
        console.log(`✅ Communes saved`);
        
        await fs.writeFile(
            path.join(dataDir, 'province-commune-mapping.json'),
            JSON.stringify({ metadata: completeData.metadata, mapping: communesByProvince }, null, 2),
            'utf-8'
        );
        console.log(`✅ Mapping saved`);
        
        // 8. Statistics
        const stats = {
            totalProvinces: provinces.length,
            totalCommunes: allCommunes.length,
            averageCommunesPerProvince: Math.round(allCommunes.length / provinces.length),
            provincesWithMostCommunes: provinces
                .map(p => ({ code: p.code, name: p.name, communesCount: (communesByProvince[p.code] || []).length }))
                .sort((a, b) => b.communesCount - a.communesCount)
                .slice(0, 10),
            provincesWithNoCommunes: provinces
                .filter(p => !(communesByProvince[p.code] || []).length)
                .map(p => ({ code: p.code, name: p.name }))
        };
        
        await fs.writeFile(
            path.join(dataDir, 'statistics.json'),
            JSON.stringify(stats, null, 2),
            'utf-8'
        );
        console.log(`✅ Statistics saved`);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n🎉 Completed in ${duration}s`);
        console.log(`📊 ${stats.totalProvinces} provinces, ${stats.totalCommunes} communes`);
        console.log(`📁 Saved in: ${dataDir}`);
        
    } catch (error) {
        console.error('\n❌ Failed:', error.message);
        process.exit(1);
    }
}

crawlAddressData();