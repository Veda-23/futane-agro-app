/**
 * Automated Verification: Inventory Stock Reconciliation & Production-Sales Auto-Sync
 * Futane Agro ERP - Ultra-Lightweight Production Quality Test
 */

const http = require('http');

const BASE_URL = 'http://localhost:8081';
let authToken = '';

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const reqHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...headers
        };
        if (authToken) {
            reqHeaders['Authorization'] = `Bearer ${authToken}`;
        }
        const data = body ? JSON.stringify(body) : null;
        if (data) {
            reqHeaders['Content-Length'] = Buffer.byteLength(data);
        }

        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: reqHeaders
        }, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(resData);
                } catch (e) {
                    parsed = resData;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: parsed
                });
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('========================================================================');
    console.log(' FUTANE AGRO ERP: INVENTORY & PRODUCTION-SALES RECONCILIATION SUITE');
    console.log('========================================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(cond, msg) {
        if (cond) {
            console.log(`[PASS] ${msg}`);
            passed++;
        } else {
            console.error(`[FAIL] ${msg}`);
            failed++;
        }
    }

    try {
        // Step 1: Login
        console.log('--- 1. Authenticating as SUPER_ADMIN ---');
        const loginRes = await request('POST', '/api/users/login', {
            username: 'SUPER_ADMIN',
            password: 'superadmin123'
        });
        
        let token = null;
        if (loginRes.data && loginRes.data.tempOtp) {
            const otp = loginRes.data.tempOtp;
            console.log(`   2FA OTP issued: ${otp}`);
            const verifyRes = await request('POST', '/api/users/login/verify', {
                username: 'SUPER_ADMIN',
                otp: otp
            });
            token = verifyRes.data.token;
        } else if (loginRes.data && loginRes.data.token) {
            token = loginRes.data.token;
        }

        assert(token && token.length > 20, 'Authentication successfully acquired JWT token');
        authToken = token;

        // Step 2: Query Inventory Baseline
        console.log('\n--- 2. Checking Inventory Baseline ---');
        const invInitialRes = await request('GET', '/api/inventory');
        assert(invInitialRes.status === 200, 'GET /api/inventory returned HTTP 200 OK');
        assert(Array.isArray(invInitialRes.data), 'Inventory returned array of SKU records');

        const testCrateType = '20L Standard Industrial Crate';
        const testMaterial = 'Plastic';

        let existingInv = invInitialRes.data.find(i => i.crateType === testCrateType && i.materialType === testMaterial);
        let baseProduced = existingInv ? (existingInv.producedStock || 0) : 0;
        let baseSold = existingInv ? (existingInv.soldStock || 0) : 0;
        let baseOpening = existingInv ? (existingInv.openingStock || 0) : 0;
        let baseCurrent = existingInv ? (existingInv.currentStock || 0) : 0;

        console.log(`   Baseline for '${testCrateType}':`);
        console.log(`   Opening: ${baseOpening}, Produced: ${baseProduced}, Sold: ${baseSold}, Current Available: ${baseCurrent}`);

        // Step 3: Production Logging Auto-Sync
        console.log('\n--- 3. Testing Production Run (PPD) Auto-Sync to Inventory ---');
        const producedQty = 450;
        const rejectedQty = 15;
        const totalRun = producedQty + rejectedQty;

        const ppdRes = await request('POST', '/api/ppd', {
            date: new Date().toISOString().split('T')[0],
            crateType: testCrateType,
            shift: 'Shift A (Morning)',
            operatorName: 'Suresh Patil',
            totalProduction: totalRun,
            successful: producedQty,
            rejected: rejectedQty
        });

        assert(ppdRes.status === 200, 'POST /api/ppd logged production run successfully');
        const ppdId = ppdRes.data.id;

        // Verify inventory update
        const invAfterProdRes = await request('GET', '/api/inventory');
        const invAfterProd = invAfterProdRes.data.find(i => i.crateType === testCrateType && i.materialType === testMaterial);
        assert(invAfterProd != null, 'Target SKU found in inventory after production run');

        const expectedProduced = baseProduced + producedQty;
        const expectedCurrentAfterProd = (invAfterProd.openingStock + expectedProduced) - invAfterProd.soldStock;

        assert(invAfterProd.producedStock === expectedProduced, `Produced stock incremented from ${baseProduced} to ${expectedProduced}`);
        assert(invAfterProd.currentStock === expectedCurrentAfterProd, `Current available stock recalculated to ${expectedCurrentAfterProd}`);

        // Step 4: Sales Dispatch Auto-Sync
        console.log('\n--- 4. Testing Sales Dispatch Auto-Sync to Inventory ---');
        const partiesRes = await request('GET', '/api/parties');
        const party = partiesRes.data[0];

        const saleQty = 150;
        const saleRate = 320.00;

        const saleRes = await request('POST', '/api/sales', {
            date: new Date().toISOString().split('T')[0],
            crateType: testCrateType,
            crateMaterial: testMaterial,
            quantity: saleQty,
            rate: saleRate,
            paid: 0.00,
            party: { id: party.id }
        });

        assert(saleRes.status === 200, 'POST /api/sales dispatched crates successfully');
        const saleId = saleRes.data.id;

        // Verify inventory update
        const invAfterSaleRes = await request('GET', '/api/inventory');
        const invAfterSale = invAfterSaleRes.data.find(i => i.crateType === testCrateType && i.materialType === testMaterial);

        const expectedSold = baseSold + saleQty;
        const expectedCurrentAfterSale = (invAfterSale.openingStock + invAfterSale.producedStock) - expectedSold;

        assert(invAfterSale.soldStock === expectedSold, `Sold stock incremented from ${baseSold} to ${expectedSold}`);
        assert(invAfterSale.currentStock === expectedCurrentAfterSale, `Current available stock reduced to ${expectedCurrentAfterSale}`);
        assert(invAfterSale.currentStock === expectedCurrentAfterProd - saleQty, 'Stock invariant holds: current = produced - sold');

        // Step 5: Soft-Delete Sale & Revert Sold Stock
        console.log('\n--- 5. Testing Sales Soft-Deletion & Stock Reversal ---');
        await request('DELETE', `/api/sales/${saleId}`);

        const invAfterSaleDeleteRes = await request('GET', '/api/inventory');
        const invAfterSaleDelete = invAfterSaleDeleteRes.data.find(i => i.crateType === testCrateType && i.materialType === testMaterial);

        assert(invAfterSaleDelete.soldStock === baseSold, `Sold stock successfully reverted back to ${baseSold}`);
        assert(invAfterSaleDelete.currentStock === expectedCurrentAfterProd, `Current stock restored to ${expectedCurrentAfterProd}`);

        // Step 6: Soft-Delete Production Run & Revert Produced Stock
        console.log('\n--- 6. Testing Production Soft-Deletion & Stock Reversal ---');
        await request('DELETE', `/api/ppd/${ppdId}`);

        const invAfterProdDeleteRes = await request('GET', '/api/inventory');
        const invAfterProdDelete = invAfterProdDeleteRes.data.find(i => i.crateType === testCrateType && i.materialType === testMaterial);

        assert(invAfterProdDelete.producedStock === baseProduced, `Produced stock successfully reverted back to ${baseProduced}`);
        assert(invAfterProdDelete.currentStock === baseCurrent, `Current available stock restored to initial baseline: ${baseCurrent}`);

        // Step 7: Summary
        console.log('\n========================================================================');
        console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
        console.log('========================================================================');

        if (failed > 0) process.exit(1);
        else process.exit(0);

    } catch (err) {
        console.error('Unexpected test exception:', err);
        process.exit(1);
    }
}

runTests();
