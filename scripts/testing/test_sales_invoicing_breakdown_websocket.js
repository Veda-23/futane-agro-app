/**
 * Automated Verification: Sales, Invoicing, GST, Payments, Machinery & WebSocket
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
    console.log('===============================================================');
    console.log(' FUTANE AGRO ERP: SALES, INVOICING, GST & MACHINERY TEST SUITE');
    console.log('===============================================================\n');

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

        assert(token && token.length > 20, 'Authentication successfully returned valid JWT token');
        authToken = token;

        // Step 2: Ensure a party exists
        console.log('\n--- 2. Fetching / Preparing Customer Party ---');
        const partiesRes = await request('GET', '/api/parties');
        let party = null;
        if (Array.isArray(partiesRes.data) && partiesRes.data.length > 0) {
            party = partiesRes.data[0];
            console.log(`   Found existing party: ${party.partyName} (ID: ${party.id})`);
        } else {
            console.log('   Creating new test customer party...');
            const newPartyRes = await request('POST', '/api/parties', {
                partyName: 'Sahyadri Agro Traders',
                partyType: 'Customer',
                partyContact: '9822334455',
                partyEmail: 'accounts@sahyadriagro.in',
                city: 'Baramati',
                state: 'Maharashtra',
                gstNumber: '27AABCS1429B1Z8'
            });
            party = newPartyRes.data;
        }
        assert(party && party.id, 'Target customer party resolved');

        // Step 3: Sales Order Creation & Server-side GST Calculation
        console.log('\n--- 3. Testing Sales Creation & GST Calculation ---');
        const qty = 100;
        const rate = 250.00;
        const expectedGross = 25000.00;
        const expectedCgst = 2250.00; // 9%
        const expectedSgst = 2250.00; // 9%
        const expectedTotal = 29500.00; // 18%

        const saleRes = await request('POST', '/api/sales', {
            date: new Date().toISOString().split('T')[0],
            crateType: '24-Bottle Dairy Crate',
            crateMaterial: 'Virgin HDPE (Grade-A)',
            quantity: qty,
            rate: rate,
            paid: 0.00,
            party: { id: party.id }
        });

        assert(saleRes.status === 200, 'POST /api/sales returned HTTP 200 OK');
        const sale = saleRes.data;
        const saleId = sale.id;

        assert(parseFloat(sale.totalAmount) === expectedTotal, `Server calculated total ₹${sale.totalAmount} matches expected ₹${expectedTotal}`);
        assert(parseFloat(sale.cgst) === expectedCgst, `CGST 9% ₹${sale.cgst} matches expected ₹${expectedCgst}`);
        assert(parseFloat(sale.sgst) === expectedSgst, `SGST 9% ₹${sale.sgst} matches expected ₹${expectedSgst}`);
        assert(parseFloat(sale.remaining) === expectedTotal, `Initial remaining balance ₹${sale.remaining} equals total ₹${expectedTotal}`);

        // Step 4: Automatic Invoice Issuance Verification
        console.log('\n--- 4. Verifying Auto-Generated Invoice ---');
        const invoicesRes = await request('GET', '/api/invoices');
        assert(invoicesRes.status === 200, 'GET /api/invoices returned HTTP 200 OK');
        
        const invoice = invoicesRes.data.find(inv => inv.sale && (inv.sale.id === saleId || inv.sale.id === sale.saleId));
        assert(invoice != null, 'Linked invoice found for the newly created sale');
        const invoicePattern = /^INV-\d{8}-.+/;
        assert(invoice && invoicePattern.test(invoice.invoiceNo), `Invoice format valid: ${invoice ? invoice.invoiceNo : 'N/A'}`);

        // Step 5: Payment Registration & Outstanding Ledger Impact
        console.log('\n--- 5. Testing Payment Collections & Balance Tracking ---');
        const partialPayment = 10000.00;
        const payRes1 = await request('POST', '/api/payments', {
            paymentDate: new Date().toISOString().split('T')[0],
            amountReceived: partialPayment,
            paymentMode: 'NEFT/RTGS',
            referenceNo: 'UTR9988776655',
            invoiceNo: invoice.invoiceNo,
            party: { id: party.id }
        });

        assert(payRes1.status === 200, 'Partial payment of ₹10,000 registered successfully');

        // Verify remaining balance on sale
        const salesCheck1 = await request('GET', '/api/sales');
        const updatedSale1 = salesCheck1.data.find(s => s.id === saleId);
        assert(parseFloat(updatedSale1.paid) === 10000.00, `Sale paid balance updated to ₹${updatedSale1.paid}`);
        assert(parseFloat(updatedSale1.remaining) === 19500.00, `Sale remaining balance reduced to ₹${updatedSale1.remaining}`);

        // Step 6: Overpayment Protection Guard
        console.log('\n--- 6. Testing Overpayment Protection Guard ---');
        const excessivePayment = 25000.00; // Remaining is only 19500
        const payResFail = await request('POST', '/api/payments', {
            paymentDate: new Date().toISOString().split('T')[0],
            amountReceived: excessivePayment,
            paymentMode: 'Cash',
            invoiceNo: invoice.invoiceNo,
            party: { id: party.id }
        });

        assert(payResFail.status === 400 || payResFail.status === 500, `Overpayment was rejected properly with HTTP ${payResFail.status}`);

        // Settle remaining balance
        const payRes2 = await request('POST', '/api/payments', {
            paymentDate: new Date().toISOString().split('T')[0],
            amountReceived: 19500.00,
            paymentMode: 'UPI',
            referenceNo: 'UPI9876543210',
            invoiceNo: invoice.invoiceNo,
            party: { id: party.id }
        });
        assert(payRes2.status === 200, 'Final settlement payment of ₹19,500 registered successfully');

        const salesCheck2 = await request('GET', '/api/sales');
        const updatedSale2 = salesCheck2.data.find(s => s.id === saleId);
        assert(parseFloat(updatedSale2.remaining) === 0.00, `Sale fully settled, remaining balance is ₹${updatedSale2.remaining}`);

        // Step 7: Machine Master & Breakdown Logging
        console.log('\n--- 7. Testing Machine Master & Breakdown Logging ---');
        const uniqueSuffix = Date.now().toString().slice(-4);
        const machineRes = await request('POST', '/api/machines', {
            machineName: `Windsor 550T Moulding Machine #${uniqueSuffix}`,
            machineCode: `MC-550T-${uniqueSuffix}`,
            manufacturer: 'Windsor Machines Ltd.',
            capacityPerHour: 480,
            installedDate: '2024-02-15',
            status: 'Running'
        });
        assert(machineRes.status === 200 && machineRes.data.id, 'Machine master entry created successfully');
        const testMachine = machineRes.data;

        // Log a breakdown for this machine (downtime is Integer minutes)
        const breakdownRes = await request('POST', '/api/breakdowns', {
            date: new Date().toISOString().split('T')[0],
            issue: 'Hydraulic Pressure Valve Seal Degraded',
            downtime: 150, // 150 minutes
            resolvedBy: 'Rajesh Patil (Sr. Maintenance Eng.)',
            machine: { id: testMachine.id }
        });
        console.log('   Breakdown POST status:', breakdownRes.status, 'body:', breakdownRes.data);
        assert(breakdownRes.status === 200, 'Machine breakdown incident logged successfully without lazy load errors');
        const testBreakdown = breakdownRes.data;
        assert(testBreakdown && testBreakdown.machine && testBreakdown.machine.id === testMachine.id, 'Breakdown properly references parent machine');

        // Fetch breakdowns
        const allBreakdownsRes = await request('GET', '/api/breakdowns');
        const foundBd = allBreakdownsRes.data.find(b => b.id === testBreakdown.id);
        assert(foundBd != null, 'Logged breakdown found in GET /api/breakdowns query');

        // Clean up breakdown and machine
        await request('DELETE', `/api/breakdowns/${testBreakdown.id}`);
        await request('DELETE', `/api/machines/${testMachine.id}`);
        console.log('   Cleaned up test breakdown and machine records.');

        // Step 8: WebSocket Endpoint Check
        console.log('\n--- 8. Testing WebSocket / STOMP Transport Health ---');
        const wsInfo = await request('GET', '/ws-erp/info');
        assert(wsInfo.status === 200, 'SockJS endpoint /ws-erp/info is live and responsive');
        assert(wsInfo.data && wsInfo.data.websocket === true, 'WebSocket transport enabled in SockJS handshake info');

        // Summary
        console.log('\n===============================================================');
        console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
        console.log('===============================================================');

        if (failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }

    } catch (err) {
        console.error('Unexpected test exception:', err);
        process.exit(1);
    }
}

runTests();
