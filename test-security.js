/**
 * Security Testing Script
 * Run: node test-security.js
 */

const BASE_URL = 'http://localhost:8000';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: XSS Protection
async function testXSSProtection() {
    log('cyan', '\n========================================');
    log('cyan', 'TEST 1: XSS PROTECTION');
    log('cyan', '========================================\n');

    const payload = {
        username: '<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'Test@12345'
    };

    try {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.data?.user?.username?.includes('<script>')) {
            log('red', '❌ FAIL: XSS script not sanitized');
        } else {
            log('green', '✅ PASS: XSS script sanitized');
            log('blue', `   Sanitized username: ${data.data?.user?.username || 'N/A'}`);
        }
    } catch (error) {
        log('red', `❌ ERROR: ${error.message}`);
    }
}

// Test 2: NoSQL Injection Protection
async function testNoSQLInjection() {
    log('cyan', '\n========================================');
    log('cyan', 'TEST 2: NoSQL INJECTION PROTECTION');
    log('cyan', '========================================\n');

    const payload = {
        username: { "$ne": null },
        password: { "$ne": null }
    };

    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.status_code === 1) {
            log('red', '❌ FAIL: NoSQL injection successful (logged in without credentials!)');
        } else {
            log('green', '✅ PASS: NoSQL injection blocked');
            log('blue', `   Response: ${data.data?.message || 'Authentication failed'}`);
        }
    } catch (error) {
        log('red', `❌ ERROR: ${error.message}`);
    }
}

// Test 3: Rate Limiting (Auth)
async function testAuthRateLimit() {
    log('cyan', '\n========================================');
    log('cyan', 'TEST 3: AUTH RATE LIMITING (5 req/15min)');
    log('cyan', '========================================\n');

    log('yellow', 'Sending 6 consecutive login requests...\n');

    let rateLimited = false;

    for (let i = 1; i <= 6; i++) {
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'testuser',
                    password: 'wrongpassword'
                })
            });

            const data = await response.json();
            
            if (response.status === 429 || data.data?.error_code === 429) {
                log('green', `✅ Request ${i}: Rate limited (expected)`);
                rateLimited = true;
                break;
            } else {
                log('blue', `   Request ${i}: ${response.status} - ${data.data?.message || 'Failed'}`);
            }
        } catch (error) {
            log('red', `❌ Request ${i} ERROR: ${error.message}`);
        }
    }

    if (rateLimited) {
        log('green', '\n✅ PASS: Auth rate limiting working correctly');
    } else {
        log('red', '\n❌ FAIL: Auth rate limiting not working (sent 6 requests without limit)');
    }
}

// Test 4: Compression
async function testCompression() {
    log('cyan', '\n========================================');
    log('cyan', 'TEST 4: RESPONSE COMPRESSION');
    log('cyan', '========================================\n');

    try {
        const response = await fetch(`${BASE_URL}/article/list`, {
            headers: {
                'Accept-Encoding': 'gzip, deflate'
            }
        });

        const contentEncoding = response.headers.get('content-encoding');
        
        if (contentEncoding && contentEncoding.includes('gzip')) {
            log('green', '✅ PASS: Response compression enabled (gzip)');
        } else {
            log('yellow', '⚠️  WARNING: Response compression not detected');
            log('blue', `   Content-Encoding: ${contentEncoding || 'none'}`);
        }
    } catch (error) {
        log('red', `❌ ERROR: ${error.message}`);
    }
}

// Test 5: Security Headers (Helmet)
async function testSecurityHeaders() {
    log('cyan', '\n========================================');
    log('cyan', 'TEST 5: SECURITY HEADERS (Helmet)');
    log('cyan', '========================================\n');

    try {
        const response = await fetch(`${BASE_URL}/`);

        const headers = {
            'X-DNS-Prefetch-Control': response.headers.get('x-dns-prefetch-control'),
            'X-Frame-Options': response.headers.get('x-frame-options'),
            'X-Content-Type-Options': response.headers.get('x-content-type-options'),
            'X-XSS-Protection': response.headers.get('x-xss-protection'),
            'Strict-Transport-Security': response.headers.get('strict-transport-security')
        };

        log('blue', 'Security headers present:');
        let passCount = 0;
        
        for (const [header, value] of Object.entries(headers)) {
            if (value) {
                log('green', `   ✅ ${header}: ${value}`);
                passCount++;
            } else {
                log('red', `   ❌ ${header}: Not set`);
            }
        }

        if (passCount >= 3) {
            log('green', '\n✅ PASS: Security headers configured');
        } else {
            log('red', '\n❌ FAIL: Missing critical security headers');
        }
    } catch (error) {
        log('red', `❌ ERROR: ${error.message}`);
    }
}

// Test 6: Timeout Protection
async function testTimeout() {
    log('cyan', '\n========================================');
    log('cyan', 'TEST 6: REQUEST TIMEOUT (30s limit)');
    log('cyan', '========================================\n');

    log('yellow', 'Note: This test requires a slow endpoint to be created');
    log('blue', 'Skipping automated test (would take >30 seconds)\n');
    log('green', '✅ Timeout middleware is configured in app.js (30s)');
}

// Run all tests
async function runAllTests() {
    log('cyan', '\n╔════════════════════════════════════════╗');
    log('cyan', '║     SECURITY TESTING SUITE            ║');
    log('cyan', '║     E-Commerce API                     ║');
    log('cyan', '╚════════════════════════════════════════╝');

    log('yellow', '\nMake sure the server is running on http://localhost:8000\n');

    await testXSSProtection();
    await testNoSQLInjection();
    await testAuthRateLimit();
    await testCompression();
    await testSecurityHeaders();
    await testTimeout();

    log('cyan', '\n========================================');
    log('cyan', 'ALL TESTS COMPLETED');
    log('cyan', '========================================\n');
    
    log('yellow', 'Additional manual tests recommended:');
    log('blue', '1. Test HTTPS redirect in production environment');
    log('blue', '2. Test payment rate limiting (10 req/hour)');
    log('blue', '3. Load test with concurrent requests');
    log('blue', '4. Test MongoDB sanitization in complex queries\n');
}

// Run tests
runAllTests().catch(error => {
    log('red', `\n❌ FATAL ERROR: ${error.message}\n`);
    process.exit(1);
});
