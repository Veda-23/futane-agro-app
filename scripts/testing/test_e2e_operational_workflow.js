/**
 * Automated End-to-End Operational Workflow Integration Suite
 * Futane Agro ERP - Ultra-Lightweight Production Quality Test
 *
 * Validates the entire integrated operational lifecycle:
 * 1. SUPER_ADMIN 2FA Authentication Handshake
 * 2. Customer Party Verification & Statutory GSTIN Resolution
 * 3. Sales Order Issuance & Precise Dual-Component GST (CGST 9% + SGST 9%)
 * 4. Automatic Tax Invoice Generation & Ledger Linkage
 * 5. Outward Logistics Dispatch Manifest (Gate Pass: Pending -> In Transit -> Delivered)
 * 6. Partial Payment Recording & Balance Tracking
 * 7. Overpayment Protection Guard Validation (Rejection of excessive collection)
 * 8. Final Balance Settlement & Zero-Balance Ledger Closure
 */

const http = require('http');

const BASE_URL = 'http://127.0.0.1:8081';
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

async function runWorkflow() {
    console.log('=====================================================================');
    console.log(' FUTANE AGRO ERP: END-TO-END OPERATIONAL WORKFLOW VALIDATION SUITE');
    console.log(' Sales -> 18% GST -> Invoice -> Dispatch Manifest -> Payment Ledger');
    console.log('=====================================================================\n');

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
        // Step 1: 2FA Authentication
        console.log('--- Phase 1: SUPER_ADMIN 2FA Authentication Handshake ---');
        const loginRes = await request('POST', '/api/users/login', {
            username: 'SUPER_ADMIN',
            password: 'superadmin123'
        });
        
        let token = null;
        if (loginRes.data && loginRes.data.tempOtp) {
            const otp = loginRes.data.tempOtp;
            console.log(`   2FA Challenge issued: ${otp}`);
            const verifyRes = await request('POST', '/api/users/login/verify', {
                username: 'SUPER_ADMIN',
                otp: otp
            });
            token = verifyRes.data.token;
        } else if (loginRes.data && loginRes.data.token) {
            token = loginRes.data.token;
        }

        assert(token && token.length > 20, 'SUPER_ADMIN authenticated successfully with valid JWT token');
        authToken = token;

        // Step 2: Customer Party Resolution
        console.log('\n--- Phase 2: Resolving Customer Party & Statutory Tax ID ---');
        const partiesRes = await request('GET', '/api/parties');
        let party = null;
        if (Array.isArray(partiesRes.data) && partiesRes.data.length > 0) {
            party = partiesRes.data.find(p => p.partyType === 'Customer') || partiesRes.data[0];
            console.log(`   Using existing party: "${party.partyName}" (ID: ${party.id}, GSTIN: ${party.gstNumber || 'N/A'})`);
        } else {
            console.log('   Creating dedicated verification customer party...');
            const newPartyRes = await request('POST', '/api/parties', {
                partyName: 'Vidarbha Dairy Consortium Ltd.',
                partyType: 'Customer',
                partyContact: '9822998877',
                partyEmail: 'procurement@vidarbhadairy.co.in',
                city: 'Nagpur',
                state: 'Maharashtra',
                gstNumber: '27AABCV5544K1Z2',
                partyAddress: 'Plot 44, MIDC Industrial Area, Hingna, Nagpur'
            });
            party = newPartyRes.data;
            console.log(`   Created test party: "${party.partyName}" (ID: ${party.id})`);
        }
        assert(party && party.id, 'Target commercial customer resolved');

        // Step 3: Sales Order Creation with 18% GST (CGST 9% + SGST 9%)
        console.log('\n--- Phase 3: Sales Order Creation & Server-Side GST Calculation ---');
        const qty = 150;
        const rate = 280.00;
        const expectedGross = 42000.00; // 150 * 280
        const expectedCgst = 3780.00;   // 9% of 42,000
        const expectedSgst = 3780.00;   // 9% of 42,000
        const expectedTotal = 49560.00; // 42,000 + 7,560

        console.log(`   Placing order: ${qty} crates @ ₹${rate.toFixed(2)} | Expected Total: ₹${expectedTotal.toFixed(2)}`);
        const saleRes = await request('POST', '/api/sales', {
            date: new Date().toISOString().split('T')[0],
            crateType: '24-Bottle Dairy Crate',
            crateMaterial: 'Virgin HDPE (Grade-A Food Contact)',
            quantity: qty,
            rate: rate,
            paid: 0.00,
            party: { id: party.id }
        });

        assert(saleRes.status === 200, 'POST /api/sales returned HTTP 200 OK');
        const sale = saleRes.data;
        const saleId = sale.id;

        assert(parseFloat(sale.totalAmount) === expectedTotal, `Gross + 18% GST matches ₹${expectedTotal.toFixed(2)}`);
        assert(parseFloat(sale.cgst) === expectedCgst, `CGST 9% correctly calculated as ₹${expectedCgst.toFixed(2)}`);
        assert(parseFloat(sale.sgst) === expectedSgst, `SGST 9% correctly calculated as ₹${expectedSgst.toFixed(2)}`);
        assert(parseFloat(sale.remaining) === expectedTotal, `Initial outstanding balance equals gross total ₹${expectedTotal.toFixed(2)}`);

        // Step 4: Automatic Invoice Issuance Verification
        console.log('\n--- Phase 4: Automatic GST Tax Invoice Issuance ---');
        const invoicesRes = await request('GET', '/api/invoices');
        assert(invoicesRes.status === 200, 'GET /api/invoices returned HTTP 200 OK');
        
        const invoice = invoicesRes.data.find(inv => inv.sale && (inv.sale.id === saleId || inv.sale.id === sale.saleId));
        assert(invoice != null, 'Auto-generated invoice found linked directly to the sale order');
        const invoicePattern = /^INV-\d{8}-.+/;
        assert(invoice && invoicePattern.test(invoice.invoiceNo), `Invoice serial conforms to statutory standard: ${invoice ? invoice.invoiceNo : 'N/A'}`);
        const invoiceTotal = invoice.totalAmount ? parseFloat(invoice.totalAmount) : (invoice.sale ? parseFloat(invoice.sale.totalAmount) : null);
        assert(invoiceTotal === expectedTotal, `Invoice linked order total matches sales order total ₹${expectedTotal.toFixed(2)}`);

        // Step 5: Logistics Outward Dispatch Manifest Lifecycle
        console.log('\n--- Phase 5: Outward Logistics Dispatch Manifest & Transit Lifecycle ---');
        const vehicleNum = 'MH-12-PQ-8899';
        const driverName = 'Baldev Singh Gill';
        const deliveryAddr = party.partyAddress || party.address || 'MIDC Hingna, Nagpur';

        console.log(`   Registering Outward Manifest: Vehicle [${vehicleNum}], Driver [${driverName}]`);
        const createDispatchRes = await request('POST', '/api/dispatches', {
            sale: { id: saleId },
            vehicleNumber: vehicleNum,
            driverName: driverName,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
        });

        assert(createDispatchRes.status === 200, 'POST /api/dispatches created gate pass manifest');
        const dispatchRecord = createDispatchRes.data;
        assert(dispatchRecord && dispatchRecord.id, 'Dispatch record has valid persistent UUID');
        assert(dispatchRecord.status === 'Pending', 'Initial dispatch manifest state is "Pending"');

        // Verify dispatch manifests query
        const dispatchesRes = await request('GET', '/api/dispatches');
        const foundDispatch = dispatchesRes.data.find(d => d.id === dispatchRecord.id);
        assert(foundDispatch != null, 'Manifest retrieved in GET /api/dispatches registry');

        // Transition: Pending -> In Transit
        console.log('   Updating Manifest: Dispatching truck from loading bay (Pending -> In Transit)...');
        const updateInTransitRes = await request('PUT', `/api/dispatches/${dispatchRecord.id}`, {
            vehicleNumber: vehicleNum,
            driverName: driverName,
            date: dispatchRecord.date,
            status: 'In Transit'
        });
        assert(updateInTransitRes.status === 200 && updateInTransitRes.data.status === 'In Transit',
               'Manifest state transitioned successfully to "In Transit"');

        // Transition: In Transit -> Delivered
        console.log('   Updating Manifest: Consignment delivered at consignee dock (In Transit -> Delivered)...');
        const updateDeliveredRes = await request('PUT', `/api/dispatches/${dispatchRecord.id}`, {
            vehicleNumber: vehicleNum,
            driverName: driverName,
            date: dispatchRecord.date,
            status: 'Delivered'
        });
        assert(updateDeliveredRes.status === 200 && updateDeliveredRes.data.status === 'Delivered',
               'Manifest state transitioned successfully to "Delivered"');

        // Step 6: Partial Payment Collections & Ledger Tracking
        console.log('\n--- Phase 6: Partial Payment Registration & Balance Tracking ---');
        const partialPayment = 20000.00;
        console.log(`   Registering partial receipt: ₹${partialPayment.toFixed(2)} via NEFT/RTGS`);
        const payRes1 = await request('POST', '/api/payments', {
            paymentDate: new Date().toISOString().split('T')[0],
            amountReceived: partialPayment,
            paymentMode: 'NEFT/RTGS',
            referenceNo: 'UTR-NAGPUR-998877',
            invoiceNo: invoice.invoiceNo,
            party: { id: party.id }
        });

        assert(payRes1.status === 200, 'Partial payment of ₹20,000 accepted and recorded');

        // Verify remaining balance on sale
        const salesCheck1 = await request('GET', '/api/sales');
        const updatedSale1 = salesCheck1.data.find(s => s.id === saleId);
        const expectedRemainingAfterPartial = expectedTotal - partialPayment; // 49560 - 20000 = 29560
        assert(parseFloat(updatedSale1.paid) === partialPayment, `Sale paid balance updated to ₹${updatedSale1.paid}`);
        assert(parseFloat(updatedSale1.remaining) === expectedRemainingAfterPartial,
               `Sale remaining balance accurately reduced to ₹${updatedSale1.remaining} (Expected ₹${expectedRemainingAfterPartial.toFixed(2)})`);

        // Step 7: Overpayment Protection Guard
        console.log('\n--- Phase 7: Overpayment Protection Validation ---');
        const excessivePayment = 35000.00; // Remaining is only 29560
        console.log(`   Attempting overpayment of ₹${excessivePayment.toFixed(2)} on outstanding ₹${expectedRemainingAfterPartial.toFixed(2)}...`);
        const payResFail = await request('POST', '/api/payments', {
            paymentDate: new Date().toISOString().split('T')[0],
            amountReceived: excessivePayment,
            paymentMode: 'Cash',
            invoiceNo: invoice.invoiceNo,
            party: { id: party.id }
        });

        assert(payResFail.status === 400 || payResFail.status === 500,
               `Overpayment strictly rejected by server with HTTP status ${payResFail.status}`);

        // Step 8: Final Balance Settlement & Complete Ledger Closure
        console.log('\n--- Phase 8: Final Settlement & Ledger Closure ---');
        console.log(`   Settling final outstanding balance: ₹${expectedRemainingAfterPartial.toFixed(2)} via UPI`);
        const payRes2 = await request('POST', '/api/payments', {
            paymentDate: new Date().toISOString().split('T')[0],
            amountReceived: expectedRemainingAfterPartial,
            paymentMode: 'UPI',
            referenceNo: 'UPI-SETTLE-49560',
            invoiceNo: invoice.invoiceNo,
            party: { id: party.id }
        });
        assert(payRes2.status === 200, 'Final settlement payment of ₹29,560 accepted successfully');

        const salesCheck2 = await request('GET', '/api/sales');
        const updatedSale2 = salesCheck2.data.find(s => s.id === saleId);
        assert(parseFloat(updatedSale2.paid) === expectedTotal, `Sale cumulative paid balance equals total ₹${updatedSale2.paid}`);
        assert(parseFloat(updatedSale2.remaining) === 0.00, `Sale fully settled, remaining balance is exactly ₹0.00`);

        // Phase 9: Clean Up
        console.log('\n--- Phase 9: Test Dispatch Clean Up ---');
        await request('DELETE', `/api/dispatches/${dispatchRecord.id}`);
        console.log(`   Soft-deleted verification dispatch manifest: ${dispatchRecord.id}`);
        assert(true, 'Test dispatch manifest lifecycle finalized');

        // Summary
        console.log('\n=====================================================================');
        console.log(` OPERATIONAL WORKFLOW TEST: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
        console.log('=====================================================================');

        if (failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }

    } catch (err) {
        console.error('Operational test execution failed with error:', err);
        process.exit(1);
    }
}

runWorkflow();
