export function generateVolume3() {
  const allControllers = [
    {
      name: "AuthController", base: "/api/users", role: "ANONYMOUS / PUBLIC",
      desc: "Zero-Trust authentication gateway managing dual-phase login, challenge-response OTP verification, password hashing, and token revocation.",
      endpoints: [
        { method: "POST", path: "/api/users/login", desc: "Step 1: Authenticates user credentials against PBKDF2 hash, generates 300-second ephemeral OTP challenge, and records audit trail.", req: `{\n  "username": "SUPER_ADMIN",\n  "password": "superadmin123"\n}`, res: `{\n  "status": "CHALLENGE_REQUIRED",\n  "username": "SUPER_ADMIN",\n  "tempOtp": "839201",\n  "expiresInSeconds": 300,\n  "message": "Phase 1 passed. Enter OTP challenge code."\n}` },
        { method: "POST", path: "/api/users/login/verify", desc: "Step 2: Validates ephemeral OTP against session nonce and issues cryptographically signed JWT token with role claims.", req: `{\n  "username": "SUPER_ADMIN",\n  "otp": "839201"\n}`, res: `{\n  "status": "AUTHENTICATED",\n  "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJTVVBFUl9BRE1JTiIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImV4cCI6MTc2MTEyMDAwMH0...",\n  "username": "SUPER_ADMIN",\n  "role": "SUPER_ADMIN",\n  "name": "Enterprise Super Administrator",\n  "tenantId": "futane_agro"\n}` },
        { method: "POST", path: "/api/users/logout", desc: "Invalidates active session token, clears session cookie, and logs security logout event.", req: `{}`, res: `{\n  "status": "LOGGED_OUT",\n  "timestamp": "2026-10-21T18:30:00Z"\n}` },
        { method: "GET", path: "/api/users/me", desc: "Returns profile, role privileges, and assigned tenant ID for the currently authenticated caller.", req: `// Headers: Authorization: Bearer <jwt>`, res: `{\n  "id": 1,\n  "username": "SUPER_ADMIN",\n  "name": "Enterprise Admin",\n  "role": "SUPER_ADMIN",\n  "tenantId": "futane_agro",\n  "active": true\n}` }
      ]
    },
    {
      name: "DashboardController", base: "/api/dashboard", role: "AUTHENTICATED",
      desc: "Executive BI analytics aggregator providing top-line KPIs, sales totals, production velocity, scrap ratios, and inventory alerts.",
      endpoints: [
        { method: "GET", path: "/api/dashboard/stats", desc: "Retrieves consolidated factory overview stats including live month-to-date sales, crate production volume, and cash flow balance.", req: `// Headers: Authorization: Bearer <jwt>`, res: `{\n  "totalSalesThisMonth": 2845600.00,\n  "totalCratesProduced": 14250,\n  "productionEfficiencyPct": 94.20,\n  "rawMaterialStockKg": 18450.50,\n  "pendingDispatchesCount": 8,\n  "criticalLowStockSkus": 2,\n  "totalReceivablesInr": 1245000.00,\n  "activeMachineCount": 3\n}` },
        { method: "GET", path: "/api/dashboard/recent-activity", desc: "Fetches recent transactional activity feed across production shifts, gate passes, invoices, and payments.", req: `// Query param: ?limit=10`, res: `[\n  {\n    "id": 901,\n    "type": "INVOICE",\n    "title": "Invoice INV-2026-0512 Generated",\n    "amount": 247800.00,\n    "timestamp": "2026-10-21T18:20:00Z"\n  }\n]` }
      ]
    },
    {
      name: "ProductionController", base: "/api/production", role: "OPERATOR, MANAGER, ADMIN, SUPER_ADMIN",
      desc: "Daily Production Per Day (PPD) and Monthly Production Target (PPM) execution and shift recording.",
      endpoints: [
        { method: "GET", path: "/api/production/ppd", desc: "Lists all daily production logs with optional filtering by date range, shift, crate type, and machine ID.", req: `// Query params: ?dateFrom=2026-10-01&dateTo=2026-10-21&shift=SHIFT_1`, res: `[\n  {\n    "id": 104,\n    "productionDate": "2026-10-21",\n    "shift": "SHIFT_1",\n    "machineId": 1,\n    "crateType": "500ml Dairy Crate",\n    "rawMaterialUsedKg": 480.00,\n    "targetCrates": 500,\n    "successfulCrates": 492,\n    "rejectedCrates": 8,\n    "scrapWeightKg": 7.80,\n    "efficiencyPct": 98.40,\n    "operatorName": "Ramesh Pawar"\n  }\n]` },
        { method: "POST", path: "/api/production/ppd", desc: "Records a new daily production shift log, auto-computes efficiency %, deducts raw material inventory, and adds to finished stock.", req: `{\n  "productionDate": "2026-10-21",\n  "shift": "SHIFT_2",\n  "machineId": 2,\n  "crateType": "1L Agro Crate",\n  "rawMaterialUsedKg": 620.00,\n  "targetCrates": 600,\n  "successfulCrates": 588,\n  "rejectedCrates": 12,\n  "scrapWeightKg": 11.40,\n  "operatorName": "Suresh Shinde",\n  "remarks": "Clean cycle, minor gate flash trimmed on 12 units"\n}`, res: `{\n  "id": 105,\n  "status": "CREATED",\n  "efficiencyPct": 98.00,\n  "message": "Production logged. 588 crates added to inventory. 620kg PP deducted."\n}` },
        { method: "GET", path: "/api/production/ppm", desc: "Retrieves monthly production quota targets and achieved crate volumes for the specified year and month.", req: `// Query params: ?year=2026&month=10`, res: `[\n  {\n    "id": 12,\n    "year": 2026,\n    "month": 10,\n    "crateType": "500ml Dairy Crate",\n    "monthlyTargetCrates": 15000,\n    "achievedCrates": 11200,\n    "allocatedGranulesKg": 15000.00,\n    "targetEfficiencyPct": 95.00,\n    "status": "ACTIVE"\n  }\n]` },
        { method: "POST", path: "/api/production/ppm", desc: "Creates or updates an executive monthly target quota for a product line variant.", req: `{\n  "year": 2026,\n  "month": 11,\n  "crateType": "2L Cold Crate",\n  "monthlyTargetCrates": 8000,\n  "allocatedGranulesKg": 9200.00,\n  "targetEfficiencyPct": 94.00\n}`, res: `{\n  "id": 15,\n  "status": "CREATED",\n  "message": "Target established for November 2026."\n}` }
      ]
    },
    {
      name: "InventoryController", base: "/api/inventory", role: "VIEWER, OPERATOR, MANAGER, ADMIN, SUPER_ADMIN",
      desc: "Finished goods crate inventory catalog, stock adjustments, minimum reorder thresholds, and warehouse valuation.",
      endpoints: [
        { method: "GET", path: "/api/inventory", desc: "Returns list of all finished crate SKUs, available stock counts, unit costs, and safety status.", req: `// Optional query param: ?crateType=500ml`, res: `[\n  {\n    "id": 1,\n    "itemName": "500ml Dairy Milk Crate - Royal Blue",\n    "crateType": "500ml Dairy Crate",\n    "color": "Royal Blue",\n    "currentStock": 1420,\n    "minimumThreshold": 200,\n    "unitCost": 185.00,\n    "warehouseLocation": "BAY-A-01",\n    "stockStatus": "HEALTHY"\n  }\n]` },
        { method: "PUT", path: "/api/inventory/{id}/adjust", desc: "Manually audits or adjusts inventory count with required audit justification.", req: `{\n  "adjustedStock": 1450,\n  "reason": "Physical count audit verified after month-end reconciliation"\n}`, res: `{\n  "id": 1,\n  "newStock": 1450,\n  "previousStock": 1420,\n  "difference": 30,\n  "status": "UPDATED"\n}` },
        { method: "GET", path: "/api/inventory/low-stock", desc: "Lists all finished crate models whose physical warehouse inventory is at or below minimum threshold.", req: `// GET /api/inventory/low-stock`, res: `[\n  {\n    "id": 3,\n    "itemName": "2L Cold Chain Crate - High Visibility Orange",\n    "currentStock": 45,\n    "minimumThreshold": 100,\n    "deficit": 55\n  }\n]` }
      ]
    },
    {
      name: "SalesController", base: "/api/sales", role: "MANAGER, ADMIN, SUPER_ADMIN",
      desc: "Commercial sales orders, agreed unit rates, total quantities, freight terms, and delivery schedules.",
      endpoints: [
        { method: "GET", path: "/api/sales", desc: "Queries customer sales orders with filtering by party, order status, or date range.", req: `// Query params: ?status=PENDING&page=0&size=25`, res: `[\n  {\n    "id": 89,\n    "orderNo": "SO-2026-0089",\n    "partyName": "Baramati Dairy Products",\n    "crateType": "500ml Dairy Crate",\n    "quantity": 1000,\n    "rate": 210.00,\n    "subtotal": 210000.00,\n    "gstAmount": 37800.00,\n    "totalAmount": 247800.00,\n    "orderDate": "2026-10-21",\n    "status": "PENDING"\n  }\n]` },
        { method: "POST", path: "/api/sales", desc: "Creates a new customer sales order, calculates 18% GST, validates party credit limit, and assigns sequence number.", req: `{\n  "partyId": 12,\n  "crateType": "500ml Dairy Crate",\n  "quantity": 1000,\n  "rate": 210.00,\n  "orderDate": "2026-10-21",\n  "deliveryDueDate": "2026-10-25"\n}`, res: `{\n  "id": 89,\n  "orderNo": "SO-2026-0089",\n  "subtotal": 210000.00,\n  "gstAmount": 37800.00,\n  "totalAmount": 247800.00,\n  "status": "PENDING"\n}` },
        { method: "PATCH", path: "/api/sales/{id}/status", desc: "Transitions order status (e.g., PENDING -> IN_PRODUCTION -> READY -> DISPATCHED).", req: `{\n  "status": "IN_PRODUCTION"\n}`, res: `{\n  "id": 89,\n  "previousStatus": "PENDING",\n  "newStatus": "IN_PRODUCTION"\n}` }
      ]
    },
    {
      name: "InvoiceController", base: "/api/invoices", role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      desc: "Tax invoices under HSN 3923, CGST/SGST/IGST breakdown, IRN cryptographic hash, E-Way Bill numbers, and ledger totals.",
      endpoints: [
        { method: "GET", path: "/api/invoices", desc: "Lists tax invoices with search by invoice number, party, date range, or payment status.", req: `// Query params: ?page=0&size=20&paymentStatus=UNPAID`, res: `[\n  {\n    "id": 512,\n    "invoiceNo": "INV-2026-0512",\n    "partyName": "Baramati Dairy Products",\n    "invoiceDate": "2026-10-21",\n    "subtotal": 210000.00,\n    "cgstAmount": 18900.00,\n    "sgstAmount": 18900.00,\n    "igstAmount": 0.00,\n    "grandTotal": 247800.00,\n    "paymentStatus": "UNPAID"\n  }\n]` },
        { method: "POST", path: "/api/invoices", desc: "Generates an official GST tax invoice from a dispatch or sales order, creates double-entry receivable, and assigns sequential invoice number.", req: `{\n  "partyId": 12,\n  "invoiceDate": "2026-10-21",\n  "items": [\n    {\n      "description": "500ml Heavy-Duty Dairy Crate (HSN 3923)",\n      "hsnCode": "3923",\n      "quantity": 1000,\n      "unitRate": 210.00\n    }\n  ]\n}`, res: `{\n  "id": 512,\n  "invoiceNo": "INV-2026-0512",\n  "subtotal": 210000.00,\n  "cgstRate": 9.00,\n  "cgstAmount": 18900.00,\n  "sgstRate": 9.00,\n  "sgstAmount": 18900.00,\n  "igstRate": 0.00,\n  "igstAmount": 0.00,\n  "roundOff": 0.00,\n  "grandTotal": 247800.00,\n  "paymentStatus": "UNPAID"\n}` },
        { method: "GET", path: "/api/invoices/{id}/pdf", desc: "Streams formatted binary A4 tax invoice PDF with GST headers, HSN summary, and payment bank account details.", req: `// GET /api/invoices/512/pdf`, res: `// [Binary PDF stream: Content-Type: application/pdf]` }
      ]
    },
    {
      name: "PaymentController", base: "/api/payments", role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      desc: "Customer receipts, bank transfers, cheque clearances, and ledger balance offsets.",
      endpoints: [
        { method: "GET", path: "/api/payments", desc: "Lists all payment receipts with filtering by customer party or payment date.", req: `// Query params: ?partyId=12`, res: `[\n  {\n    "id": 412,\n    "receiptNo": "REC-2026-0412",\n    "partyName": "Baramati Dairy Products",\n    "paymentDate": "2026-10-21",\n    "amount": 247800.00,\n    "paymentMode": "RTGS",\n    "referenceNo": "HDFCR52026102100912"\n  }\n]` },
        { method: "POST", path: "/api/payments", desc: "Records receipt of customer funds, credits customer ledger, updates bank account balance, and prints receipt voucher.", req: `{\n  "partyId": 12,\n  "paymentDate": "2026-10-21",\n  "amount": 247800.00,\n  "paymentMode": "RTGS",\n  "referenceNo": "HDFCR52026102100912",\n  "bankAccountId": 1,\n  "notes": "Full settlement against Invoice INV-2026-0512"\n}`, res: `{\n  "id": 412,\n  "receiptNo": "REC-2026-0412",\n  "status": "POSTED",\n  "newPartyBalance": 0.00,\n  "message": "Payment recorded and ledger reconciled."\n}` }
      ]
    },
    {
      name: "RawMaterialController", base: "/api/raw-materials", role: "OPERATOR, MANAGER, ADMIN, SUPER_ADMIN",
      desc: "Granule inventory tracking virgin polypropylene, recycled regrind, masterbatch pigments, supplier lots, and safety stocks.",
      endpoints: [
        { method: "GET", path: "/api/raw-materials", desc: "Returns live inventory balance of all polymer raw materials and color masterbatch grades.", req: `// GET /api/raw-materials`, res: `[\n  {\n    "id": 1,\n    "materialName": "Reliance Repol H030SG Polypropylene Granules",\n    "materialType": "VIRGIN_PP",\n    "currentStockKg": 18450.50,\n    "reorderLevelKg": 2000.00,\n    "costPerKg": 94.50\n  }\n]` },
        { method: "POST", path: "/api/raw-materials/inward", desc: "Logs receipt of polymer granule shipment from vendor, increases warehouse balance, and records batch lot certificate.", req: `{\n  "materialId": 1,\n  "vendorId": 3,\n  "inwardDate": "2026-10-21",\n  "quantityKg": 5000.00,\n  "costPerKg": 94.50,\n  "batchLotNo": "REPOL-H030-B92",\n  "invoiceRef": "REL-2026-88192"\n}`, res: `{\n  "status": "RECORDED",\n  "newStockKg": 23450.50,\n  "message": "5000 kg PP granules added to warehouse."\n}` }
      ]
    },
    {
      name: "VendorController", base: "/api/vendors", role: "MANAGER, ADMIN, SUPER_ADMIN",
      desc: "Polymer resin and additive manufacturers, GSTIN credentials, payment terms, and vendor payable ledger balances.",
      endpoints: [
        { method: "GET", path: "/api/vendors", desc: "Lists all approved raw material suppliers and additive vendors.", req: `// GET /api/vendors`, res: `[\n  {\n    "id": 3,\n    "vendorName": "Reliance Industries Limited",\n    "contactPerson": "Amit Joshi",\n    "phone": "9822019283",\n    "gstin": "27AAACR1234F1Z8",\n    "city": "Mumbai",\n    "paymentTermsDays": 30,\n    "outstandingPayable": 472500.00\n  }\n]` },
        { method: "POST", path: "/api/vendors", desc: "Registers a new chemical or petrochemical supplier in the procurement master.", req: `{\n  "vendorName": "Indian Oil Corporation Limited",\n  "contactPerson": "Prakash Nair",\n  "phone": "9823091823",\n  "gstin": "27AAACI1234D1Z2",\n  "city": "Pune",\n  "paymentTermsDays": 30\n}`, res: `{\n  "id": 4,\n  "status": "CREATED",\n  "message": "Vendor profile registered successfully."\n}` }
      ]
    },
    {
      name: "PartyController", base: "/api/parties", role: "ALL ROLES",
      desc: "Customer and distributor directory with GSTIN numbers, billing addresses, credit limits, and outstanding ledger balances.",
      endpoints: [
        { method: "GET", path: "/api/parties", desc: "Returns customer directory with current ledger balances and credit limits.", req: `// Query param: ?search=Baramati`, res: `[\n  {\n    "id": 12,\n    "name": "Baramati Dairy Products Cooperative",\n    "phone": "9822182736",\n    "gstin": "27AAACB1234K1Z4",\n    "city": "Baramati",\n    "state": "Maharashtra",\n    "creditLimit": 500000.00,\n    "currentBalance": 247800.00\n  }\n]` },
        { method: "POST", path: "/api/parties", desc: "Creates a new commercial customer account with address, GSTIN, and credit terms.", req: `{\n  "name": "Sangamner Agro Cooperative Ltd",\n  "contactPerson": "Dilip Deshmukh",\n  "phone": "9822918273",\n  "gstin": "27AAACS9876P1Z3",\n  "address": "Gat No 412, Sangamner MIDC",\n  "city": "Sangamner",\n  "state": "Maharashtra",\n  "pincode": "422605",\n  "creditLimit": 300000.00\n}`, res: `{\n  "id": 13,\n  "status": "CREATED",\n  "message": "Customer registered successfully."\n}` }
      ]
    },
    {
      name: "DispatchController", base: "/api/dispatch", role: "OPERATOR, MANAGER, ADMIN, SUPER_ADMIN",
      desc: "Factory gate logistics passes, vehicle weighment records, driver sign-offs, sales order references, and crate counts.",
      endpoints: [
        { method: "GET", path: "/api/dispatch", desc: "Lists outbound dispatch records and gate passes.", req: `// Query params: ?dateFrom=2026-10-01`, res: `[\n  {\n    "id": 811,\n    "dispatchNo": "GP-2026-0811",\n    "partyName": "Baramati Dairy Products",\n    "crateType": "500ml Dairy Crate",\n    "quantityDispatched": 1000,\n    "dispatchDate": "2026-10-21",\n    "vehicleNo": "MH-12-RN-4821",\n    "driverName": "Ashok Jadhav",\n    "netWeightKg": 2250.00\n  }\n]` },
        { method: "POST", path: "/api/dispatch", desc: "Generates an official factory gate pass, validates vehicle number and driver license, and marks sales order as dispatched.", req: `{\n  "salesId": 89,\n  "partyId": 12,\n  "crateType": "500ml Dairy Crate",\n  "quantityDispatched": 1000,\n  "dispatchDate": "2026-10-21",\n  "vehicleNo": "MH-12-RN-4821",\n  "driverId": 4,\n  "transportId": 2,\n  "grossWeightKg": 11450.00,\n  "tareWeightKg": 9200.00\n}`, res: `{\n  "id": 811,\n  "dispatchNo": "GP-2026-0811",\n  "netWeightKg": 2250.00,\n  "status": "DISPATCHED",\n  "message": "Gate pass created. 1000 crates removed from finished inventory."\n}` }
      ]
    },
    {
      name: "TransportController", base: "/api/transports", role: "MANAGER, ADMIN, SUPER_ADMIN",
      desc: "Commercial transport carrier agencies, freight rates, vehicle capacity specs, and carrier GSTINs.",
      endpoints: [
        { method: "GET", path: "/api/transports", desc: "Lists all registered logistics transport agencies.", req: `// GET /api/transports`, res: `[\n  {\n    "id": 2,\n    "transportName": "Mahadev Freight Carriers",\n    "contactPerson": "Kailash Patil",\n    "phone": "9822456789",\n    "gstin": "27AAACM4567P1Z1"\n  }\n]` },
        { method: "POST", path: "/api/transports", desc: "Registers a new commercial transport carrier firm.", req: `{\n  "transportName": "Khandoba Roadlines",\n  "contactPerson": "Ganesh More",\n  "phone": "9822987654",\n  "gstin": "27AAACK7890Q1Z2"\n}`, res: `{\n  "id": 3,\n  "status": "CREATED"\n}` }
      ]
    },
    {
      name: "DriverController", base: "/api/drivers", role: "MANAGER, ADMIN, SUPER_ADMIN",
      desc: "Commercial truck drivers, heavy motor vehicle (HMV) driving license numbers, mobile numbers, and transport firm affiliations.",
      endpoints: [
        { method: "GET", path: "/api/drivers", desc: "Lists all commercial drivers registered in the fleet KYC system.", req: `// GET /api/drivers`, res: `[\n  {\n    "id": 4,\n    "driverName": "Ashok Jadhav",\n    "licenseNo": "MH12-2018-0091823",\n    "phone": "9822876543",\n    "transportName": "Mahadev Freight Carriers",\n    "vehicleNo": "MH-12-RN-4821"\n  }\n]` },
        { method: "POST", path: "/api/drivers", desc: "Onboards a new commercial driver with verified HMV driving license.", req: `{\n  "driverName": "Sanjay Shinde",\n  "licenseNo": "MH14-2020-0019283",\n  "phone": "9823123456",\n  "transportId": 2,\n  "vehicleNo": "MH-14-BT-9122"\n}`, res: `{\n  "id": 5,\n  "status": "CREATED"\n}` }
      ]
    },
    {
      name: "BankController", base: "/api/bank", role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      desc: "Company current accounts, cash registers, account numbers, IFSC codes, bank branches, and cleared ledger balances.",
      endpoints: [
        { method: "GET", path: "/api/bank/accounts", desc: "Retrieves all company bank accounts and current cleared balances.", req: `// GET /api/bank/accounts`, res: `[\n  {\n    "id": 1,\n    "accountName": "HDFC Bank Main Current A/c",\n    "bankName": "HDFC Bank Ltd",\n    "accountNumber": "50200012345678",\n    "ifscCode": "HDFC0001234",\n    "branch": "Baramati MIDC",\n    "currentBalance": 1845200.00\n  }\n]` },
        { method: "POST", path: "/api/bank/transactions", desc: "Posts a debit or credit contra transaction directly to a bank ledger.", req: `{\n  "accountId": 1,\n  "transactionDate": "2026-10-21",\n  "type": "DEBIT",\n  "amount": 25000.00,\n  "referenceNo": "CHQ-001298",\n  "description": "Factory petty cash replenishment"\n}`, res: `{\n  "status": "RECORDED",\n  "newBalance": 1820200.00\n}` }
      ]
    },
    {
      name: "ExpenseController", base: "/api/expenses", role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      desc: "Factory operational expense vouchers, electricity bills, hydraulic oil, consumables, logistics, and cost center allocations.",
      endpoints: [
        { method: "GET", path: "/api/expenses", desc: "Lists operating expense vouchers with category filtering.", req: `// Query param: ?category=ELECTRICITY`, res: `[\n  {\n    "id": 1044,\n    "voucherNo": "EXP-2026-1044",\n    "category": "ELECTRICITY",\n    "expenseDate": "2026-10-15",\n    "amount": 142500.00,\n    "paidTo": "MSEDCL Maharashtra State Electricity",\n    "paymentMode": "BANK_TRANSFER",\n    "approvedBy": "Plant Director"\n  }\n]` },
        { method: "POST", path: "/api/expenses", desc: "Creates a new operational expense voucher and deducts funds from the bank account.", req: `{\n  "category": "HYDRAULIC_OIL",\n  "expenseDate": "2026-10-21",\n  "amount": 38500.00,\n  "paidTo": "Castrol Industrial Lubricants",\n  "paymentMode": "BANK_TRANSFER",\n  "approvedBy": "Managing Director",\n  "invoiceRef": "CAS-2026-4412"\n}`, res: `{\n  "id": 1045,\n  "voucherNo": "EXP-2026-1045",\n  "status": "POSTED"\n}` }
      ]
    },
    {
      name: "EmployeeController", base: "/api/employees", role: "ALL ROLES",
      desc: "Workforce master records, plant department, designation, biometric ID, daily wage/salary rate, and KYC credentials.",
      endpoints: [
        { method: "GET", path: "/api/employees", desc: "Lists all factory employees with department and designation.", req: `// GET /api/employees`, res: `[\n  {\n    "id": 14,\n    "employeeCode": "EMP-0104",\n    "name": "Ramesh Pawar",\n    "department": "PRODUCTION",\n    "designation": "Lead Molding Operator",\n    "phone": "9822112233",\n    "baseSalary": 28000.00,\n    "active": true\n  }\n]` },
        { method: "POST", path: "/api/employees", desc: "Onboards a new employee into workforce directory.", req: `{\n  "employeeCode": "EMP-0105",\n  "name": "Vikram Salunkhe",\n  "department": "MAINTENANCE",\n  "designation": "Electrical Technician",\n  "phone": "9822334455",\n  "joiningDate": "2026-10-21",\n  "baseSalary": 26000.00\n}`, res: `{\n  "id": 15,\n  "status": "CREATED"\n}` }
      ]
    },
    {
      name: "SalaryController", base: "/api/salaries", role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      desc: "Monthly payroll disbursement registers, days worked, overtime hours, advance deductions, and net payable calculations.",
      endpoints: [
        { method: "GET", path: "/api/salaries", desc: "Queries processed salary slips for specified payroll month.", req: `// Query params: ?year=2026&month=9`, res: `[\n  {\n    "id": 89,\n    "employeeName": "Ramesh Pawar",\n    "payrollMonth": 9,\n    "payrollYear": 2026,\n    "daysWorked": 26.0,\n    "overtimeHours": 14.0,\n    "grossSalary": 30269.00,\n    "advanceDeducted": 2000.00,\n    "netPayable": 28269.00,\n    "paymentStatus": "PAID"\n  }\n]` },
        { method: "POST", path: "/api/salaries/process", desc: "Calculates and posts monthly employee salary slip.", req: `{\n  "employeeId": 14,\n  "payrollMonth": 10,\n  "payrollYear": 2026,\n  "daysWorked": 26.0,\n  "overtimeHours": 12.0,\n  "advanceDeducted": 0.00\n}`, res: `{\n  "id": 92,\n  "netPayable": 29946.00,\n  "status": "APPROVED"\n}` }
      ]
    },
    {
      name: "MachineController", base: "/api/machines", role: "ALL ROLES",
      desc: "Injection molding machine registry, clamping tonnage, screw diameter, hydraulic specs, and operational status.",
      endpoints: [
        { method: "GET", path: "/api/machines", desc: "Lists all injection molding machines with operational status.", req: `// GET /api/machines`, res: `[\n  {\n    "id": 1,\n    "machineCode": "M-01",\n    "machineName": "Windsor Wintech 350-Ton",\n    "clampingForceTons": 350,\n    "status": "RUNNING"\n  }\n]` },
        { method: "POST", path: "/api/machines/breakdown", desc: "Logs an unplanned machine stoppage incident.", req: `{\n  "machineId": 1,\n  "breakdownDate": "2026-10-21",\n  "breakdownTime": "14:15:00",\n  "rootCause": "HYDRAULIC_LEAK",\n  "technicianName": "Prakash Yadav"\n}`, res: `{\n  "id": 44,\n  "status": "LOGGED",\n  "machineStatus": "BREAKDOWN"\n}` }
      ]
    },
    {
      name: "BillingHubController", base: "/api/billinghub", role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      desc: "Centralized document repository consolidating invoices, receipts, gate passes, and delivery challans.",
      endpoints: [
        { method: "GET", path: "/api/billinghub/documents", desc: "Unified multi-entity document search.", req: `// Query param: ?q=INV-2026`, res: `[\n  {\n    "docId": "INV-2026-0512",\n    "type": "TAX_INVOICE",\n    "party": "Baramati Dairy Products",\n    "amount": 247800.00,\n    "date": "2026-10-21"\n  }\n]` }
      ]
    },
    {
      name: "ReportController", base: "/api/reports", role: "MANAGER, ACCOUNTANT, ADMIN, SUPER_ADMIN",
      desc: "Generates analytical business intelligence management reports.",
      endpoints: [
        { method: "GET", path: "/api/reports/sales-summary", desc: "Aggregated sales report by customer and crate variant.", req: `// Query params: ?from=2026-10-01&to=2026-10-21`, res: `{\n  "totalTaxable": 2410000.00,\n  "totalGst": 433800.00,\n  "totalBilled": 2843800.00\n}` }
      ]
    },
    {
      name: "AnalyticsController", base: "/api/analytics", role: "MANAGER, ACCOUNTANT, ADMIN, SUPER_ADMIN",
      desc: "Power BI style visual analytical KPIs, machine OEE, and resin yields.",
      endpoints: [
        { method: "GET", path: "/api/analytics/kpis", desc: "Comprehensive plant efficiency and yield KPIs.", req: `// GET /api/analytics/kpis`, res: `{\n  "averagePlantOee": 93.80,\n  "polymerScrapRatio": 1.60,\n  "grossMarginPct": 24.50\n}` }
      ]
    },
    {
      name: "AuditLogController", base: "/api/audit-logs", role: "SUPER_ADMIN",
      desc: "Security audit trail inspection and user action forensics.",
      endpoints: [
        { method: "GET", path: "/api/audit-logs", desc: "Queries immutable audit logs.", req: `// Query params: ?page=0&size=50`, res: `{\n  "content": [\n    {\n      "id": 9924,\n      "action": "INVOICE_CREATED",\n      "username": "SUPER_ADMIN",\n      "timestamp": "2026-10-21T18:22:10Z"\n    }\n  ]\n}` }
      ]
    },
    {
      name: "SettingsController", base: "/api/settings", role: "SUPER_ADMIN, ADMIN",
      desc: "Global system configuration keys, factory metadata, GST credentials, thermal print sizes, and invoice prefixes.",
      endpoints: [
        { method: "GET", path: "/api/settings", desc: "Returns all system configuration key-value mappings.", req: `// GET /api/settings`, res: `[\n  { "key": "company_name", "value": "Futane Agro Industries Pvt. Ltd." },\n  { "key": "gstin", "value": "27AAACF1234M1Z5" }\n]` },
        { method: "PUT", path: "/api/settings", desc: "Updates a system configuration parameter.", req: `{\n  "key": "company_name",\n  "value": "Futane Agro Industries Private Limited"\n}`, res: `{\n  "status": "UPDATED"\n}` }
      ]
    },
    {
      name: "TenantConfigController", base: "/api/tenant-config", role: "SUPER_ADMIN",
      desc: "Multi-tenant white-labeling, brand colors, custom logos, and legal business names.",
      endpoints: [
        { method: "GET", path: "/api/tenant-config/{tenantId}", desc: "Fetches tenant branding configuration.", req: `// GET /api/tenant-config/futane_agro`, res: `{\n  "tenantId": "futane_agro",\n  "companyName": "Futane Agro Industries",\n  "primaryColor": "#2563eb",\n  "gstin": "27AAACF1234M1Z5"\n}` }
      ]
    },
    {
      name: "DatabaseStudioController", base: "/api/enterprise/database-studio", role: "SUPER_ADMIN",
      desc: "Zero-Trust administrative SQL studio providing controlled query execution.",
      endpoints: [
        { method: "POST", path: "/api/enterprise/database-studio/query", desc: "Executes parameterized SQL statement.", req: `{\n  "sql": "SELECT crate_type, SUM(successful_crates) FROM production_ppd GROUP BY crate_type"\n}`, res: `{\n  "rowCount": 3,\n  "executionTimeMs": 4.2,\n  "rows": [["500ml Dairy Crate", 8450], ["1L Agro Crate", 4200]]\n}` }
      ]
    },
    {
      name: "BackupRestoreController", base: "/api/enterprise/backup", role: "SUPER_ADMIN",
      desc: "Automated and on-demand PostgreSQL database backups and integrity catalog.",
      endpoints: [
        { method: "POST", path: "/api/enterprise/backup/create", desc: "Triggers immediate full database snapshot.", req: `{}`, res: `{\n  "filename": "backup_20261021_manual.sql.gz",\n  "sizeBytes": 4829102,\n  "status": "COMPLETED"\n}` }
      ]
    },
    {
      name: "TelemetryController", base: "/api/telemetry", role: "ALL ROLES",
      desc: "Live system health, JVM heap telemetry, database connection pool, and ping endpoints.",
      endpoints: [
        { method: "GET", path: "/api/telemetry/health", desc: "Returns health status of PostgreSQL, Spring Boot, and memory.", req: `// GET /api/telemetry/health`, res: `{\n  "status": "UP",\n  "database": "CONNECTED",\n  "freeRamMb": 1420,\n  "activeDbConnections": 3\n}` }
      ]
    },
    {
      name: "RolePermissionController", base: "/api/role-permissions", role: "SUPER_ADMIN",
      desc: "Fine-grained CRUD access control matrix governing role permissions across modules.",
      endpoints: [
        { method: "GET", path: "/api/role-permissions", desc: "Lists all role permissions.", req: `// GET /api/role-permissions`, res: `[\n  { "role": "OPERATOR", "moduleKey": "production", "canView": true, "canCreate": true }\n]` }
      ]
    },
    {
      name: "CustomFieldController", base: "/api/custom-fields", role: "ADMIN, SUPER_ADMIN",
      desc: "Extensible custom metadata fields attached dynamically to entity records.",
      endpoints: [
        { method: "POST", path: "/api/custom-fields", desc: "Defines a new dynamic form field.", req: `{\n  "entityType": "INVOICE",\n  "fieldKey": "po_reference_no",\n  "fieldLabel": "Customer PO Ref",\n  "fieldType": "STRING"\n}`, res: `{\n  "id": 8,\n  "status": "CREATED"\n}` }
      ]
    },
    {
      name: "EWayBillController", base: "/api/ewaybill", role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      desc: "Government E-Way Bill generation, distance calculation, and Part-B vehicle updates.",
      endpoints: [
        { method: "POST", path: "/api/ewaybill/generate", desc: "Generates E-Way Bill for outward consignment.", req: `{\n  "invoiceId": 512,\n  "distanceKm": 120,\n  "vehicleNo": "MH-12-RN-4821"\n}`, res: `{\n  "ewbNo": "321098234512",\n  "validUntil": "2026-10-23T23:59:59Z",\n  "status": "ACTIVE"\n}` }
      ]
    },
    {
      name: "EInvoiceController", base: "/api/einvoice", role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      desc: "Invoice Registration Portal (IRP) electronic invoices, IRN hash, and QR code signing.",
      endpoints: [
        { method: "POST", path: "/api/einvoice/register", desc: "Registers B2B tax invoice with IRP gateway.", req: `{\n  "invoiceId": 512\n}`, res: `{\n  "irn": "4a7f29b8c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",\n  "signedQrCode": "data:image/svg+xml;base64,...",\n  "ackNo": "122026091823"\n}` }
      ]
    },
    {
      name: "ChallanController", base: "/api/challans", role: "OPERATOR, MANAGER, ADMIN, SUPER_ADMIN",
      desc: "Delivery challans for goods dispatched without immediate sale.",
      endpoints: [
        { method: "POST", path: "/api/challans", desc: "Creates a delivery challan for sample crates.", req: `{\n  "partyId": 12,\n  "crateType": "500ml Dairy Crate",\n  "quantity": 50,\n  "purpose": "TRIAL_SAMPLE"\n}`, res: `{\n  "challanNo": "DC-2026-0044",\n  "status": "OPEN"\n}` }
      ]
    },
    {
      name: "CreditDebitNoteController", base: "/api/credit-debit-notes", role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      desc: "Statutory credit and debit notes under GST Section 34.",
      endpoints: [
        { method: "POST", path: "/api/credit-debit-notes", desc: "Issues a credit note for damaged crates.", req: `{\n  "originalInvoiceId": 512,\n  "partyId": 12,\n  "noteType": "CREDIT",\n  "taxableDifference": 4200.00,\n  "gstAdjustment": 756.00,\n  "totalAdjustment": 4956.00,\n  "reason": "20 crushed crates returned from transit"\n}`, res: `{\n  "noteNo": "CN-2026-0012",\n  "status": "POSTED"\n}` }
      ]
    },
    {
      name: "TaxEngineController", base: "/api/tax-engine", role: "ALL ROLES",
      desc: "Automated GST rate lookup, intra/inter-state tax split validation, and rounding algorithms.",
      endpoints: [
        { method: "POST", path: "/api/tax-engine/calculate", desc: "Validates and computes exact GST breakdown.", req: `{\n  "hsnCode": "3923",\n  "taxableAmount": 210000.00,\n  "supplierStateCode": "27",\n  "recipientStateCode": "27"\n}`, res: `{\n  "isInterState": false,\n  "cgstRate": 9.00,\n  "cgstAmount": 18900.00,\n  "sgstRate": 9.00,\n  "sgstAmount": 18900.00,\n  "igstRate": 0.00,\n  "igstAmount": 0.00,\n  "totalGst": 37800.00,\n  "grandTotal": 247800.00\n}` }
      ]
    },
    {
      name: "ErpWebOrdersController", base: "/api/web-orders", role: "ANONYMOUS / PUBLIC",
      desc: "Public customer distributor portal for booking online crate orders.",
      endpoints: [
        { method: "POST", path: "/api/web-orders", desc: "Submits inbound distributor crate order.", req: `{\n  "customerName": "Ganesh Dairy Farm",\n  "phone": "9822987654",\n  "crateType": "500ml Dairy Crate",\n  "quantity": 500\n}`, res: `{\n  "orderToken": "ord_8392019a-9b21",\n  "status": "CONFIRMED",\n  "message": "Order received. Sales team will contact for dispatch."\n}` }
      ]
    },
    {
      name: "WhiteLabelController", base: "/api/white-label", role: "SUPER_ADMIN",
      desc: "Dynamic CSS theme color customization, logo asset management, and corporate identity.",
      endpoints: [
        { method: "PUT", path: "/api/white-label/theme", desc: "Applies new corporate accent color.", req: `{\n  "primaryColor": "#2563eb",\n  "darkMode": false\n}`, res: `{\n  "status": "APPLIED"\n}` }
      ]
    },
    {
      name: "EnterpriseController", base: "/api/enterprise", role: "SUPER_ADMIN",
      desc: "Administrative system orchestration, batch jobs, cache flushing, and process status.",
      endpoints: [
        { method: "POST", path: "/api/enterprise/cache/flush", desc: "Flushes in-memory Spring Cache.", req: `{}`, res: `{\n  "status": "FLUSHED"\n}` }
      ]
    },
    {
      name: "SecurityController", base: "/api/security", role: "SUPER_ADMIN",
      desc: "Cryptographic key rotation, IP blocklist management, and rate limit bucket inspection.",
      endpoints: [
        { method: "GET", path: "/api/security/blocked-ips", desc: "Lists all currently rate-limited or blocked IP addresses.", req: `// GET /api/security/blocked-ips`, res: `[]` }
      ]
    }
  ];

  let html = `
  <div>
    <h2 class="volume-title">Volume III: Spring Boot REST Microservices & Complete API Encyclopedia</h2>
    
    <h3 class="chapter-title">Chapter 1: REST Protocol & Zero-Trust Request Invariants</h3>
    <p>
      The backend service architecture is constructed upon <strong>Spring Boot 3.3.4</strong> running atop <strong>Java 21 LTS</strong>. All application features communicate via a unified, RESTful JSON microservice layer. Every request transmitted over the wire adheres to strict cryptographic, schema, and security invariants.
    </p>

    <h4 class="section-title">1.1 Standard Request Headers & Authentication Tokens</h4>
    <p>Every authenticated HTTP exchange must include the following client headers:</p>
    <table class="spec-table">
      <thead>
        <tr>
          <th>Header Name</th>
          <th>Expected Value Format</th>
          <th>Security & Architectural Requirement</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>Authorization</code></td><td><code>Bearer &lt;JWT_TOKEN&gt;</code></td><td>Cryptographic HMAC-SHA-512 token containing user identity and role claims</td></tr>
        <tr><td><code>Content-Type</code></td><td><code>application/json</code></td><td>Mandatory for all <code>POST</code>, <code>PUT</code>, and <code>PATCH</code> requests</td></tr>
        <tr><td><code>X-Request-Nonce</code></td><td>Cryptographic UUIDv4 string</td><td>Prevents replay attacks across financial transactions</td></tr>
        <tr><td><code>X-Client-Timestamp</code></td><td>ISO-8601 UTC timestamp</td><td>Enforces 300-second request expiration window</td></tr>
      </tbody>
    </table>

    <h3 class="chapter-title">Chapter 2: Master Controller Directory (All 39 Controllers)</h3>
    <p>
      Below is the comprehensive operational reference for all 39 Spring Boot REST controllers. Each entry specifies the base routing context, role prerequisites, HTTP method, JSON request schema, and realistic response payloads.
    </p>
  `;

  for (let i = 0; i < allControllers.length; i++) {
    const c = allControllers[i];
    html += `
    <div class="page-break"></div>
    <div class="avoid-break" style="padding-top: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0f172a; padding-bottom: 4px;">
        <h4 style="font-size: 13pt; font-weight: 800; color: #0f172a; margin: 0;">
          ${i + 1}. Controller: <code>${c.name}</code> (<code>${c.base}</code>)
        </h4>
        <span class="badge badge-role">Role: ${c.role}</span>
      </div>
      <p style="font-size: 8.5pt; color: #475569; margin-top: 4px; margin-bottom: 10px;">
        <strong>Description:</strong> ${c.desc}
      </p>

      ${c.endpoints.map(ep => `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="badge ${ep.method === 'POST' ? 'badge-post' : ep.method === 'GET' ? 'badge-get' : ep.method === 'PUT' ? 'badge-put' : 'badge-delete'}">${ep.method}</span>
            <code style="font-weight: 700; color: #0f172a; font-size: 8.5pt;">${ep.path}</code>
          </div>
          <p style="font-size: 8pt; color: #334155; margin-bottom: 6px;">
            ${ep.desc}
          </p>
          
          <div class="grid-2" style="margin-top: 6px; margin-bottom: 0;">
            <div>
              <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; margin-bottom: 2px;">REQUEST PAYLOAD:</div>
              <pre class="code-block" style="margin: 0;">${ep.req}</pre>
            </div>
            <div>
              <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; margin-bottom: 2px;">RESPONSE PAYLOAD:</div>
              <pre class="code-block" style="margin: 0;">${ep.res}</pre>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    `;
  }

  html += `
  </div>
  `;

  return html;
}
