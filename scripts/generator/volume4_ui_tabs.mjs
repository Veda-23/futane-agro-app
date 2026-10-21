import fs from 'fs';
import path from 'path';

export function generateVolume4() {
  const screenshotDir = path.resolve('docs', 'screenshots');

  const tabDefs = [
    {
      key: "login",
      file: "01_login_portal.png",
      title: "Login & Zero-Trust Authentication Gateway",
      shortcut: "N/A (Entry Point)",
      role: "Public Access / Unauthenticated",
      purpose: "Serves as the secure entry gateway to the Futane Agro ERP system, enforcing two-stage multi-factor authentication, cryptographic nonce validation, and IP rate limiting to prevent unauthorized intrusions.",
      fields: [
        ["Username", "Text Input", "Required", "Must match existing registered account in database", "None"],
        ["Password", "Password Input", "Required", "Minimum 8 characters with alphanumeric requirements", "None"],
        ["Two-Factor OTP", "Numeric Input (6 digits)", "Required in Phase 2", "Valid for exactly 300 seconds from issuance", "None"]
      ],
      sop: [
        "1. Open the secure ERP web URL (http://127.0.0.1:4300) in Chrome or Edge.",
        "2. Enter your authorized username (e.g., SUPER_ADMIN) and password.",
        "3. Click 'Verify Credentials' to execute Phase 1 cryptographic verification.",
        "4. When prompted by the Zero-Trust Challenge modal, enter the 6-digit OTP code.",
        "5. Click 'Complete Login'. The server issues your HMAC-SHA-512 JWT session token and redirects to the Executive Dashboard."
      ],
      math: "PBKDF2 SHA-256 Key Derivation: derived_key = PBKDF2(HMAC-SHA256, password, salt, 10000, 256). Session token lifespan = 28,800 seconds (8 hours maximum). Idle timer expiration = 15 minutes of inactivity.",
      errors: [
        ["ERR_AUTH_INVALID_CREDS", "Username or password entered does not match database record.", "Re-enter credentials carefully or contact the Super Admin for password reset."],
        ["ERR_OTP_EXPIRED", "The 6-digit OTP code exceeded the 300-second challenge lifetime.", "Click 'Resend OTP' to mint a fresh challenge nonce."],
        ["ERR_RATE_LIMIT_EXCEEDED", "More than 5 failed login attempts recorded within 60 seconds.", "IP address is temporarily throttled for 10 minutes by the RateLimitBucket filter."]
      ]
    },
    {
      key: "dashboard",
      file: "02_dashboard_overview.png",
      title: "Executive Operations Dashboard",
      shortcut: "Alt + D",
      role: "All Roles (Role-Filtered Views)",
      purpose: "Provides executive leadership, plant directors, and finance officers with a real-time, consolidated panoramic view of manufacturing velocity, machine status, monthly sales billing, and inventory alerts.",
      fields: [
        ["Quick Date Filter", "Dropdown Selector", "Optional", "Filter by Today, Current Week, Current Month, or FY 2026-27", "Current Month"],
        ["Export Summary Button", "Action Button", "Optional", "Exports active executive dashboard metrics to PDF or Excel", "None"],
        ["Refresh Data Button", "Action Button", "Optional", "Forces immediate cache invalidation and pulls live database figures", "None"]
      ],
      sop: [
        "1. Access the Executive Dashboard using the top navigation icon or pressing Alt + D.",
        "2. Review the top KPI cards for Today's Sales (INR), Daily Crates Produced, Plant OEE %, and Cash Balance.",
        "3. Inspect the 'Critical Low Stock' card to identify crate models requiring immediate production prioritization.",
        "4. Click on any machine card under 'Plant Floor Telemetry' to drill down directly into machine maintenance and breakdown history.",
        "5. Review recent invoices and gate pass dispatches in the activity stream."
      ],
      math: "Plant Efficiency % = (Total Successful Crates / Total Target Crates) * 100. Overall Equipment Effectiveness (OEE) = Availability * Performance * Quality. Net Cashflow = Total Collections - Total Expenses.",
      errors: [
        ["WARN_CACHE_STALE", "Data displayed reflects cached metrics older than 5 minutes.", "Click the top-right 'Refresh Data' button to query the database directly."],
        ["WARN_NEGATIVE_CASHFLOW", "Monthly operational expenses exceed customer payment receipts.", "Review Accounts Receivable aging in the Payments tab."]
      ]
    },
    {
      key: "production",
      file: "03_production_ppd.png",
      title: "Daily Production PPD (500ml, 1L, 2L Crates)",
      shortcut: "Alt + P",
      role: "OPERATOR, MANAGER, ADMIN, SUPER_ADMIN",
      purpose: "Tracks daily plant floor manufacturing execution across all injection molding machines, recording shift-wise raw material usage, target crate output, successful units passed to warehouse, and defective scrap.",
      fields: [
        ["Production Date", "Date Picker", "Required", "Must not be future date; format YYYY-MM-DD", "Current Date"],
        ["Shift", "Dropdown", "Required", "SHIFT_1 (Morning), SHIFT_2 (Evening), SHIFT_3 (Night)", "SHIFT_1"],
        ["Machine Selection", "Dropdown", "Required", "Active running machine asset (e.g., M-01, M-02, M-03)", "None"],
        ["Crate Type", "Dropdown", "Required", "500ml Dairy Crate, 1L Agro Crate, 2L Cold Crate", "500ml Dairy Crate"],
        ["Raw Material Used (kg)", "Numeric (2 decimals)", "Required", "Gross weight of PP granules consumed in kg", "None"],
        ["Target Crates", "Integer", "Required", "Standard planned shift target (e.g., 500 crates)", "500"],
        ["Successful Crates", "Integer", "Required", "Number of crates passed by QC inspection", "None"],
        ["Rejected Crates", "Integer", "Required", "Defective units rejected for regrind", "0"],
        ["Scrap Weight (kg)", "Numeric (2 decimals)", "Required", "Weight of runners, sprues, and rejected flash", "0.00"],
        ["Operator Name", "Text Input", "Required", "Full name of shift technician or operator", "None"]
      ],
      sop: [
        "1. Navigate to the Daily Production tab (Alt + P).",
        "2. Click '+ Log Production Shift' to open the recording form.",
        "3. Select the production date, shift, and assigned injection molding machine.",
        "4. Enter the raw material PP granules consumed from the batch lot.",
        "5. Input the final physical count of successful crates and rejected scrap units.",
        "6. Verify the auto-computed shift efficiency percentage.",
        "7. Click 'Save Production Record'. The system atomically credits the Finished Inventory warehouse and debits Raw Material granules."
      ],
      math: "Efficiency % = (Successful Crates / Target Crates) * 100. Scrap Ratio % = (Scrap Weight / Raw Material Used) * 100. Average Unit Crate Weight (kg) = (Raw Material Used - Scrap Weight) / Successful Crates.",
      errors: [
        ["ERR_PRODUCTION_ZERO_CRATES", "Target crates or successful crates cannot be zero.", "Enter valid positive integer counts."],
        ["ERR_SCRAP_EXCEEDS_INPUT", "Scrap weight cannot exceed total raw material consumed.", "Check floor weighbridge scale and re-enter accurate weights."],
        ["ERR_DUPLICATE_SHIFT_LOG", "A production log already exists for this Machine, Date, and Shift.", "Edit the existing shift log instead of creating a duplicate entry."]
      ]
    },
    {
      key: "monthly-production",
      file: "04_monthly_production_ppm.png",
      title: "Monthly Production Target Planning (PPM)",
      shortcut: "Nav Menu",
      role: "MANAGER, ADMIN, SUPER_ADMIN",
      purpose: "Enables production directors to set monthly manufacturing volume quotas per crate variant, allocate required polypropylene polymer granules, and monitor real-time cumulative completion progress.",
      fields: [
        ["Year", "Number Input", "Required", "Four-digit calendar year (e.g., 2026)", "2026"],
        ["Month", "Dropdown", "Required", "Month selector (January to December)", "Current Month"],
        ["Crate Type", "Dropdown", "Required", "Product variant (500ml, 1L, 2L Crate)", "500ml Dairy Crate"],
        ["Monthly Target Crates", "Integer Input", "Required", "Executive monthly quota (e.g., 15,000 crates)", "None"],
        ["Allocated Granules (kg)", "Numeric Input", "Required", "Total PP polymer raw material budget in kg", "None"],
        ["Target Efficiency %", "Numeric Input", "Required", "Minimum acceptable average shift efficiency (e.g., 95.0%)", "95.00%"]
      ],
      sop: [
        "1. Open the Monthly Production tab from the Operations sidebar group.",
        "2. Select the target production year and month.",
        "3. Review the current status of each crate variant line against planned monthly targets.",
        "4. Click '+ Set Monthly Target' to establish a new quota or adjust existing targets.",
        "5. Enter the target crate volume and allocated polymer granules budget.",
        "6. Save the plan. The dashboard and analytics engines immediately link daily PPD records to calculate live percentage completion."
      ],
      math: "Completion % = (Cumulative Achieved Crates / Monthly Target Crates) * 100. Granule Consumption Variance = Allocated Granules (kg) - Actual Granules Consumed (kg).",
      errors: [
        ["ERR_TARGET_ALREADY_EXISTS", "A monthly target is already established for this year, month, and crate variant.", "Update the existing target quota instead of creating a duplicate."],
        ["ERR_INSUFFICIENT_RAW_MATERIAL", "Allocated granules budget is lower than theoretical minimum required for target crates.", "Increase polymer allocation based on standard crate shot weight."]
      ]
    },
    {
      key: "inventory",
      file: "05_inventory_management.png",
      title: "Finished Goods Crate Warehouse Inventory",
      shortcut: "Alt + I",
      role: "All Roles (Role-Restricted Adjustments)",
      purpose: "Manages finished molded crates stored in the plant warehouse, providing real-time stock balances by crate model and color, tracking pallet bay allocations, and raising reorder warnings.",
      fields: [
        ["Item / SKU Name", "Text Input", "Required", "Standard description (e.g., 500ml Dairy Milk Crate - Royal Blue)", "None"],
        ["Crate Type", "Dropdown", "Required", "Classification: 500ml, 1L, 2L Crate", "500ml Dairy Crate"],
        ["Color Variant", "Dropdown", "Required", "Standard Masterbatch color: Blue, Red, Green, Yellow, Orange", "Blue"],
        ["Current Stock", "Integer Input", "System Computed", "Live warehouse crate count, auto-updated by production and dispatches", "0"],
        ["Minimum Threshold", "Integer Input", "Required", "Safety stock reorder trigger point (e.g., 200 crates)", "100"],
        ["Unit Cost (INR)", "Numeric (2 decimals)", "Required", "Standard factory manufacturing cost per unit", "0.00"],
        ["Warehouse Location", "Text Input", "Optional", "Pallet rack and bay reference (e.g., BAY-C-02)", "None"]
      ],
      sop: [
        "1. Navigate to the Finished Inventory tab (Alt + I).",
        "2. Filter stock items by Crate Type, Color, or Stock Status (Critical / Low / Healthy).",
        "3. Click 'Audit Stock Adjustment' if conducting a physical warehouse count.",
        "4. Enter the physically verified crate count and provide mandatory audit justification.",
        "5. Submit the adjustment. The system logs an immutable audit event and updates valuation figures."
      ],
      math: "Stock Valuation (INR) = Current Stock * Unit Cost. Safety Stock Margin = Current Stock - Minimum Threshold.",
      errors: [
        ["ERR_NEGATIVE_STOCK", "Inventory balance cannot drop below zero.", "Verify that previous production shifts have been logged before creating dispatches."],
        ["ERR_UNAUTHORIZED_ADJUSTMENT", "Operator roles cannot manually adjust physical stock counts.", "Request an Accountant or Administrator to execute stock adjustments."]
      ]
    },
    {
      key: "machines",
      file: "06_machine_maintenance.png",
      title: "Injection Molding Machines & Breakdown Registry",
      shortcut: "Alt + M",
      role: "OPERATOR, MANAGER, ADMIN, SUPER_ADMIN",
      purpose: "Maintains the equipment registry of all factory injection molding machines, mold attachments, hydraulic specifications, and preventative maintenance breakdown logs.",
      fields: [
        ["Machine Code", "Text Input", "Required", "Unique factory asset tag (e.g., M-01, M-02, M-03)", "None"],
        ["Machine Name / Model", "Text Input", "Required", "Manufacturer model (e.g., Windsor Wintech 350-Ton)", "None"],
        ["Clamping Force (Tons)", "Integer Input", "Required", "Rated hydraulic tonnage (e.g., 350, 450, 650 Tons)", "350"],
        ["Shot Capacity (grams)", "Numeric Input", "Required", "Maximum injection barrel capacity in grams", "None"],
        ["Manufacturer", "Text Input", "Required", "Equipment vendor name (e.g., Windsor, L&T, Haitian)", "None"],
        ["Machine Status", "Dropdown", "Required", "RUNNING, IDLE, MAINTENANCE, BREAKDOWN", "RUNNING"]
      ],
      sop: [
        "1. Open the Machines tab using Alt + M.",
        "2. Review running status and current mold assignment for each machine on the plant floor.",
        "3. In the event of an unplanned machine stoppage, toggle to the 'Breakdown Registry' sub-tab.",
        "4. Click '+ Report Machine Breakdown'.",
        "5. Select the machine asset, time of stoppage, root cause category, and technician name.",
        "6. Upon completion of repairs, enter restored time, action taken, and replacement parts cost."
      ],
      math: "Machine Availability % = ((Total Operating Hours - Downtime Hours) / Total Operating Hours) * 100. Mean Time To Repair (MTTR) = Total Downtime Hours / Total Breakdown Incidents.",
      errors: [
        ["ERR_MACHINE_IN_BREAKDOWN", "Cannot log production on a machine currently flagged with BREAKDOWN status.", "Resolve and close the active breakdown record in the Maintenance registry first."]
      ]
    },
    {
      key: "raw-materials",
      file: "07_raw_materials.png",
      title: "Raw Materials & PP Polymer Granules",
      shortcut: "Nav Menu",
      role: "OPERATOR, MANAGER, ADMIN, SUPER_ADMIN",
      purpose: "Monitors polymer raw material inventory, tracking virgin polypropylene resin, recycled regrind, masterbatch color pigments, inward vendor consignments, and scrap recovery loops.",
      fields: [
        ["Material Name", "Text Input", "Required", "Commercial polymer grade (e.g., Repol H030SG PP Granules)", "None"],
        ["Material Type", "Dropdown", "Required", "VIRGIN_PP, RECYCLED_PP, MASTERBATCH, ADDITIVE", "VIRGIN_PP"],
        ["Current Stock (kg)", "Numeric Input", "System Computed", "Total active warehouse weight in kilograms", "0.00"],
        ["Reorder Level (kg)", "Numeric Input", "Required", "Procurement trigger threshold (e.g., 1000 kg)", "1000.00"],
        ["Cost per kg (INR)", "Numeric Input", "Required", "Current purchase valuation per kilogram", "None"],
        ["Batch Lot No", "Text Input", "Required for Inward", "Manufacturer quality certificate lot number", "None"]
      ],
      sop: [
        "1. Open the Raw Materials module from the sidebar.",
        "2. When a delivery of polymer granules arrives at the factory gate, click '+ Record Inward Granules'.",
        "3. Select the supplier vendor and enter the received weight in kilograms from the weighbridge slip.",
        "4. Enter the manufacturer refinery batch certificate number.",
        "5. Verify purchase price per kg and save. Stock is immediately credited to available factory inventory."
      ],
      math: "Polymer Consumption Rate = Total PP Consumed (kg) / Total Crates Produced. Regrind Blending Ratio % = (Recycled Granules kg / Total Feedstock kg) * 100.",
      errors: [
        ["ERR_BELOW_SAFETY_STOCK", "Polymer stock has dropped below minimum safety threshold.", "Automated notification sent to Purchasing Officer to issue Vendor Purchase Requisition."]
      ]
    },
    {
      key: "vendors",
      file: "08_vendor_suppliers.png",
      title: "Polymer Raw Material Suppliers & Vendors",
      shortcut: "Nav Menu",
      role: "MANAGER, ADMIN, SUPER_ADMIN",
      purpose: "Maintains the vendor supplier directory for polymer petrochemical manufacturers, masterbatch formulators, spare parts suppliers, and utility vendors.",
      fields: [
        ["Vendor Name", "Text Input", "Required", "Registered business name (e.g., Reliance Industries Limited)", "None"],
        ["Contact Person", "Text Input", "Optional", "Sales executive or account representative", "None"],
        ["Phone Number", "Text Input", "Required", "10-digit commercial mobile number", "None"],
        ["Email Address", "Email Input", "Optional", "Purchase order delivery email", "None"],
        ["GSTIN", "Text Input", "Required for Tax Invoices", "15-digit GST registration number", "None"],
        ["City / State", "Text Input", "Required", "Municipal location and state", "None"],
        ["Payment Terms (Days)", "Integer Input", "Required", "Agreed trade credit window (e.g., 30 Days)", "30"]
      ],
      sop: [
        "1. Navigate to the Vendors tab.",
        "2. Click '+ Add New Supplier' to onboard a new polymer resin distributor.",
        "3. Enter the vendor's legal trade name, commercial contact details, and 15-digit GSTIN.",
        "4. Specify agreed trade credit terms in days.",
        "5. Save the vendor profile to enable inward consignment logging and expense voucher billing."
      ],
      math: "Accounts Payable Aging = Current Date - Inward Invoice Date. Overdue Payables = Sum of invoices exceeding Payment Terms Days.",
      errors: [
        ["ERR_INVALID_GSTIN_FORMAT", "GSTIN entered does not match standard 15-digit alphanumeric format.", "Verify GSTIN against the official government GST portal."]
      ]
    },
    {
      key: "sales",
      file: "09_sales_orders.png",
      title: "Sales Orders & Commercial Dispatch Planning",
      shortcut: "Alt + S",
      role: "MANAGER, ADMIN, SUPER_ADMIN",
      purpose: "Records customer purchase orders, manages crate unit selling prices, schedules delivery deadlines, and tracks fulfillment from production to dispatch gate pass.",
      fields: [
        ["Customer Party", "Dropdown Selector", "Required", "Registered customer from Party Directory", "None"],
        ["Crate Type", "Dropdown", "Required", "500ml Dairy Crate, 1L Agro Crate, 2L Cold Crate", "500ml Dairy Crate"],
        ["Order Quantity", "Integer Input", "Required", "Number of crates ordered", "None"],
        ["Agreed Unit Rate (INR)", "Numeric Input", "Required", "Base price per crate excluding taxes", "None"],
        ["Order Date", "Date Picker", "Required", "Date order was booked", "Current Date"],
        ["Delivery Due Date", "Date Picker", "Optional", "Target customer delivery deadline", "None"]
      ],
      sop: [
        "1. Open the Sales Orders tab (Alt + S).",
        "2. Click '+ New Sales Order'.",
        "3. Select the customer party from the searchable dropdown.",
        "4. Choose the ordered crate variant and enter agreed unit price and quantity.",
        "5. Review auto-calculated subtotal, 18% GST amount, and grand total.",
        "6. Save the sales order. The order appears in the Dispatch Planning queue."
      ],
      math: "Order Subtotal = Quantity * Unit Rate. GST Amount = Subtotal * 0.18. Grand Total = Subtotal + GST Amount.",
      errors: [
        ["ERR_EXCEEDS_CREDIT_LIMIT", "Order grand total exceeds customer's approved credit limit.", "Requires Managerial override or customer advance payment receipt."]
      ]
    },
    {
      key: "dispatch",
      file: "10_dispatch_logistics.png",
      title: "Logistics Dispatch & Factory Gate Pass",
      shortcut: "Nav Menu",
      role: "OPERATOR, MANAGER, ADMIN, SUPER_ADMIN",
      purpose: "Generates factory gate passes for outbound crate shipments, recording weighbridge tare/gross/net weights, assigned commercial vehicle numbers, and authorized driver credentials.",
      fields: [
        ["Sales Order Ref", "Dropdown Selector", "Required", "Pending sales order to fulfill", "None"],
        ["Consignee Customer", "Read-Only / Auto", "Auto-filled", "Customer party associated with sales order", "Auto"],
        ["Quantity to Dispatch", "Integer Input", "Required", "Number of crates physically loaded", "None"],
        ["Vehicle Number", "Text Input", "Required", "Commercial truck registration (e.g., MH-12-RN-4821)", "None"],
        ["Driver Name", "Dropdown / Text", "Required", "Authorized driver with verified commercial license", "None"],
        ["Freight Transporter", "Dropdown", "Required", "Associated transport logistics agency", "None"],
        ["Gross Weight (kg)", "Numeric Input", "Required for Weighbridge", "Loaded truck total weighbridge scale reading", "None"],
        ["Tare Weight (kg)", "Numeric Input", "Required for Weighbridge", "Empty truck weighbridge scale reading", "None"]
      ],
      sop: [
        "1. Navigate to the Dispatch & Gate Pass module.",
        "2. Click '+ Create Outward Gate Pass'.",
        "3. Select the sales order being fulfilled.",
        "4. Verify the quantity of crates loaded onto the vehicle.",
        "5. Enter the truck registration number, driver name, and carrier agency.",
        "6. Input gross and tare weights from the factory weighbridge printout.",
        "7. Click 'Authorize Gate Pass'. The finished goods inventory is automatically decremented and the gate pass PDF is printed for the driver."
      ],
      math: "Net Cargo Weight (kg) = Gross Weight - Tare Weight. Average Dispatched Crate Weight = Net Cargo Weight / Quantity Dispatched.",
      errors: [
        ["ERR_INSUFFICIENT_STOCK", "Loaded quantity exceeds available finished goods stock in warehouse.", "Verify physical stock before dispatching vehicle."]
      ]
    },
    {
      key: "transports",
      file: "11_fleet_transports.png",
      title: "Fleet Transport & Freight Carrier Directory",
      shortcut: "Nav Menu",
      role: "MANAGER, ADMIN, SUPER_ADMIN",
      purpose: "Maintains directory of third-party freight transport agencies, contract freight rates per trip or kilometer, carrier GSTINs, and emergency dispatch contact lines.",
      fields: [
        ["Transport Agency Name", "Text Input", "Required", "Full legal business name (e.g., Mahadev Freight Carriers)", "None"],
        ["Contact Person", "Text Input", "Optional", "Logistics coordinator or owner name", "None"],
        ["Phone Number", "Text Input", "Required", "Primary operational dispatch phone", "None"],
        ["Transporter ID (TRANSIN)", "Text Input", "Optional", "15-digit Transporter ID for E-Way Bill Part-B vehicle updates", "None"],
        ["Office Address", "Text Input", "Optional", "Physical garage or headquarters address", "None"]
      ],
      sop: [
        "1. Open Fleet Transports from the Logistics menu.",
        "2. Click '+ Register Carrier Agency'.",
        "3. Enter the agency name, contact person, phone number, and Transporter ID.",
        "4. Save the profile. The carrier is now selectable across all outbound dispatch and gate pass forms."
      ],
      math: "Freight Cost Per Crate = Total Trip Freight (INR) / Total Crates Loaded.",
      errors: [
        ["ERR_DUPLICATE_TRANSPORT", "A transport carrier with this name or TRANSIN already exists.", "Search existing carrier records."]
      ]
    },
    {
      key: "drivers",
      file: "12_driver_registry.png",
      title: "Commercial Driver Registry & Vehicle Compliance",
      shortcut: "Nav Menu",
      role: "MANAGER, ADMIN, SUPER_ADMIN",
      purpose: "Maintains KYC verification records for commercial truck drivers transporting factory goods, recording Heavy Motor Vehicle (HMV) driving license numbers, mobile numbers, and assigned trucks.",
      fields: [
        ["Driver Full Name", "Text Input", "Required", "Legal name as per government driving license", "None"],
        ["Driving License Number", "Text Input", "Required", "Unique commercial HMV license number", "None"],
        ["Mobile Phone Number", "Text Input", "Required", "10-digit mobile number for dispatch tracking", "None"],
        ["Transport Agency", "Dropdown", "Required", "Associated freight carrier firm", "None"],
        ["Default Vehicle Number", "Text Input", "Optional", "Primary assigned truck registration (e.g., MH-14-EA-9912)", "None"]
      ],
      sop: [
        "1. Open the Drivers module from the Logistics navigation group.",
        "2. Click '+ Add Commercial Driver'.",
        "3. Enter the driver's full name, commercial license number, and mobile phone.",
        "4. Select the transport firm the driver is affiliated with.",
        "5. Save the record. Driver details will automatically populate onto factory gate passes."
      ],
      math: "Driver Trip Count = Sum of dispatches where driver_id matches.",
      errors: [
        ["ERR_INVALID_LICENSE", "License number entered is invalid or already registered to another driver.", "Verify original driving license document."]
      ]
    },
    {
      key: "parties",
      file: "13_crm_customers.png",
      title: "Customer Directory & CRM Master",
      shortcut: "Nav Menu",
      role: "All Roles (Role-Restricted Adjustments)",
      purpose: "Manages customer accounts, dairy cooperatives, wholesale agricultural distributors, GSTIN credentials, delivery addresses, credit limits, and outstanding ledger balances.",
      fields: [
        ["Customer / Business Name", "Text Input", "Required", "Registered trade name (e.g., Baramati Dairy Products)", "None"],
        ["Contact Person", "Text Input", "Optional", "Purchasing agent or manager", "None"],
        ["Phone Number", "Text Input", "Required", "Primary business phone number", "None"],
        ["Email Address", "Email Input", "Optional", "Digital invoice and statement delivery email", "None"],
        ["GSTIN", "Text Input", "Required for Tax Invoices", "15-digit GST registration number", "None"],
        ["Delivery Address", "Textarea Input", "Required", "Complete factory or warehouse shipping address", "None"],
        ["City / State", "Text Input", "Required", "Municipal district and state (default: Maharashtra)", "Maharashtra"],
        ["Credit Limit (INR)", "Numeric Input", "Required", "Maximum permissible outstanding balance", "100000.00"]
      ],
      sop: [
        "1. Open the Customer Directory (CRM) tab.",
        "2. Click '+ Register New Customer'.",
        "3. Input business name, phone number, GSTIN, and physical delivery address.",
        "4. Set an approved commercial credit limit.",
        "5. Save the profile. The customer can now be selected on sales orders, dispatches, and tax invoices."
      ],
      math: "Outstanding Balance = Sum of Invoices Billed - Sum of Payments Received - Sum of Credit Notes.",
      errors: [
        ["ERR_DUPLICATE_GSTIN", "A customer party with this GSTIN is already registered in the system.", "Review existing party records."]
      ]
    },
    {
      key: "payments",
      file: "14_payments_collections.png",
      title: "Customer Payments & Financial Receipts",
      shortcut: "Nav Menu",
      role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      purpose: "Records customer payment collections, bank remittances (NEFT, RTGS, IMPS), cheques, and cash receipts, crediting customer accounts and maintaining the cash/bank reconciliation ledger.",
      fields: [
        ["Customer Party", "Dropdown", "Required", "Payer customer entity", "None"],
        ["Receipt Date", "Date Picker", "Required", "Date funds cleared in bank or received", "Current Date"],
        ["Amount Received (INR)", "Numeric Input", "Required", "Net monetary value received", "None"],
        ["Payment Mode", "Dropdown", "Required", "NEFT, RTGS, IMPS, CHEQUE, UPI, CASH", "NEFT"],
        ["Bank Reference / UTR No", "Text Input", "Required for Electronic", "Bank transaction reference or cheque number", "None"],
        ["Deposit Bank Account", "Dropdown", "Required", "Company bank current account receiving funds", "None"],
        ["Accounting Notes", "Textarea", "Optional", "Invoice allocation notes", "None"]
      ],
      sop: [
        "1. Open the Customer Payments module.",
        "2. Click '+ Record Payment Receipt'.",
        "3. Select the customer party from the dropdown.",
        "4. Enter the received amount and payment date.",
        "5. Select the payment mode and input the bank UTR or cheque reference number.",
        "6. Select the receiving company bank account.",
        "7. Click 'Post Payment'. The customer's outstanding balance is credited immediately, and a printable receipt voucher is generated."
      ],
      math: "Updated Customer Balance = Previous Balance - Payment Amount. Updated Bank Account Balance = Previous Balance + Payment Amount.",
      errors: [
        ["ERR_PAYMENT_ZERO", "Payment amount must be greater than zero.", "Enter valid monetary amount."],
        ["ERR_MISSING_UTR", "Bank UTR or transaction reference is required for electronic payment modes.", "Input valid bank reference number."]
      ]
    },
    {
      key: "invoices",
      file: "15_gst_invoices.png",
      title: "GST Tax Invoices & E-Way Bills",
      shortcut: "Nav Menu",
      role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      purpose: "Generates official Goods and Services Tax invoices under HSN Code 3923, enforcing exact 18% GST calculation (9% CGST + 9% SGST or 18% IGST), producing printable PDF tax invoices with bank details.",
      fields: [
        ["Customer Party", "Dropdown", "Required", "Billed customer account", "None"],
        ["Invoice Date", "Date Picker", "Required", "Tax invoice generation date", "Current Date"],
        ["Item Description", "Text Input", "Required", "Product description (e.g., 500ml Dairy Milk Crate)", "500ml Dairy Crate"],
        ["HSN Code", "Text Input", "Required", "Harmonized System Nomenclature code (Strictly 3923)", "3923"],
        ["Billed Quantity", "Integer Input", "Required", "Number of crates billed", "None"],
        ["Unit Selling Price (INR)", "Numeric Input", "Required", "Price per unit excluding taxes", "None"]
      ],
      sop: [
        "1. Open the GST Invoices module.",
        "2. Click '+ Generate New Tax Invoice'.",
        "3. Select the customer party.",
        "4. Add crate line items, verifying HSN 3923, quantity, and unit rate.",
        "5. Review auto-calculated Subtotal, CGST 9%, SGST 9% (or IGST 18%), and Grand Total.",
        "6. Click 'Finalize & Issue Invoice'. The system locks the invoice, generates a sequential invoice number (e.g., INV-2026-0512), debits the customer ledger, and provides an instant A4 PDF printout."
      ],
      math: "Taxable Value = Quantity * Unit Rate. If Intra-State: CGST = Taxable * 0.09, SGST = Taxable * 0.09. If Inter-State: IGST = Taxable * 0.18. Grand Total = Round(Taxable + Total GST).",
      errors: [
        ["ERR_ZERO_LINE_ITEMS", "Invoice must contain at least one line item.", "Add valid crate items before finalizing."],
        ["ERR_INVALID_HSN", "HSN Code must be 3923 for molded plastic crates.", "Re-enter correct HSN Code 3923."]
      ]
    },
    {
      key: "billinghub",
      file: "16_billing_hub.png",
      title: "Consolidated Billing Hub & Document Repository",
      shortcut: "Alt + B",
      role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      purpose: "Serves as the centralized corporate financial document repository, consolidating invoices, sales orders, customer receipts, raw material bills, delivery challans, and gate passes into a unified search matrix.",
      fields: [
        ["Document Type Filter", "Dropdown", "Optional", "Invoices, Receipts, Sales Orders, Gate Passes, Challans", "All Types"],
        ["Search Query", "Text Input", "Optional", "Filter by Invoice #, Customer Name, or UTR Ref", "None"],
        ["Date Range Selector", "Date Range", "Optional", "Filter documents across financial quarters", "Current Month"]
      ],
      sop: [
        "1. Access the Billing Hub via Alt + B or the sidebar.",
        "2. Use the document type tabs to switch between Tax Invoices, Receipts, and Dispatches.",
        "3. Type an invoice number or customer name into the search bar for instant live filtering.",
        "4. Click the 'View Document' action icon on any row to open the complete document modal preview.",
        "5. Click 'Print / Download PDF' to stream official A4 document copies."
      ],
      math: "Document Ledger Balance = Total Invoiced Amount - Total Collected Receipts.",
      errors: [
        ["ERR_DOCUMENT_NOT_FOUND", "No documents matched the specified search criteria.", "Broaden the date range or clear search filters."]
      ]
    },
    {
      key: "bank",
      file: "17_bank_accounts.png",
      title: "Treasury Banking, Cash Ledgers & Bank Reconciliation",
      shortcut: "Nav Menu",
      role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      purpose: "Manages company bank current accounts, physical cash books, bank transaction entries (debits/credits), running ledger balances, and monthly bank reconciliation statements.",
      fields: [
        ["Bank Account Name", "Text Input", "Required", "Internal ledger descriptor (e.g., HDFC Current Account)", "None"],
        ["Bank Name", "Text Input", "Required", "Commercial banking institution name", "None"],
        ["Account Number", "Text Input", "Required", "Full bank account number", "None"],
        ["IFSC Code", "Text Input", "Required", "11-digit bank branch IFSC code", "None"],
        ["Branch Location", "Text Input", "Required", "City branch name", "None"],
        ["Opening Balance (INR)", "Numeric Input", "Required", "Starting reconciled balance", "0.00"]
      ],
      sop: [
        "1. Open the Bank & Cash Accounts module.",
        "2. Review cleared cash balances across all company bank accounts and cash registers.",
        "3. To record an internal contra fund transfer or direct bank fee debit, click '+ Record Bank Transaction'.",
        "4. Select account, transaction type (DEBIT or CREDIT), amount, and bank reference number.",
        "5. Enter accounting narration and submit. The running ledger balance updates in real time."
      ],
      math: "New Balance = Previous Balance + Credits - Debits. Reconciliation Variance = Bank Statement Balance - ERP Ledger Balance.",
      errors: [
        ["ERR_INSUFFICIENT_FUNDS", "Bank account has insufficient balance to execute requested debit.", "Verify cleared funds before recording expenditure."]
      ]
    },
    {
      key: "expenses",
      file: "18_expense_tracker.png",
      title: "Factory Operational Expense Vouchers & Cost Centers",
      shortcut: "Alt + X",
      role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      purpose: "Records all non-raw material operating expenditures across factory cost centers, including electricity bills, hydraulic oil, machine spares, packaging materials, and general plant overhead.",
      fields: [
        ["Expense Category", "Dropdown", "Required", "ELECTRICITY, HYDRAULIC_OIL, SPARES, PACKAGING, TRANSPORT, TEA_SNACKS, GENERAL", "None"],
        ["Expense Date", "Date Picker", "Required", "Date expenditure occurred", "Current Date"],
        ["Amount Paid (INR)", "Numeric Input", "Required", "Total voucher amount including taxes", "None"],
        ["Paid To / Beneficiary", "Text Input", "Required", "Supplier, contractor, or staff member", "None"],
        ["Payment Mode", "Dropdown", "Required", "BANK_TRANSFER, CHEQUE, PETTY_CASH, UPI", "BANK_TRANSFER"],
        ["Approving Officer", "Text Input", "Required", "Manager or Director authorizing expense", "None"],
        ["Supporting Bill Ref", "Text Input", "Optional", "Utility bill or vendor invoice reference number", "None"]
      ],
      sop: [
        "1. Open the Expense Tracker (Alt + X).",
        "2. Click '+ Record Expense Voucher'.",
        "3. Select the operational cost center category.",
        "4. Enter the total amount paid and select payment mode.",
        "5. Input payee name and supporting bill reference.",
        "6. Save the voucher. The expense is posted to the cost ledger and deducted from the assigned bank or cash account."
      ],
      math: "Total Monthly Operating Expenses = Sum of all expense vouchers in billing month. Manufacturing Overhead Per Crate = Total Factory Expenses / Total Crates Produced.",
      errors: [
        ["ERR_MISSING_APPROVAL", "Expense vouchers exceeding INR 10,000 require formal approving officer designation.", "Enter approving executive name."]
      ]
    },
    {
      key: "salaries",
      file: "19_payroll_salaries.png",
      title: "Workforce Payroll & Monthly Salaries",
      shortcut: "Nav Menu",
      role: "ACCOUNTANT, ADMIN, SUPER_ADMIN",
      purpose: "Executes monthly workforce payroll calculations for plant technicians, operators, and staff, computing gross earnings from verified attendance, overtime hours, and advance recoveries.",
      fields: [
        ["Employee Selection", "Dropdown", "Required", "Active staff member from Employee Directory", "None"],
        ["Payroll Month & Year", "Dropdown & Number", "Required", "Disbursement cycle period (e.g., October 2026)", "Current Month"],
        ["Days Worked", "Numeric Input", "Required", "Total verified days worked in month", "26.0"],
        ["Overtime Hours", "Numeric Input", "Optional", "Approved overtime hours logged", "0.0"],
        ["Gross Salary (INR)", "Numeric Input", "System Computed", "Calculated gross earnings based on rate", "Auto"],
        ["Salary Advance Deduction", "Numeric Input", "Optional", "Advance deductions recovered (INR)", "0.00"],
        ["Net Payable (INR)", "Numeric Input", "System Computed", "Final net payment disbursed", "Auto"]
      ],
      sop: [
        "1. Open the Workforce Payroll & Salaries module.",
        "2. Select the active payroll cycle period (Month and Year).",
        "3. Click '+ Process Employee Salary'.",
        "4. Select the employee to auto-populate base wage structure.",
        "5. Enter verified days worked and approved overtime hours.",
        "6. Enter any previous salary advance recovery deductions.",
        "7. Verify Net Payable and click 'Disburse Salary'. The payroll voucher is posted to the expense ledger."
      ],
      math: "Daily Rate = Base Salary / 26. Gross Salary = (Days Worked * Daily Rate) + (Overtime Hours * (Daily Rate / 8) * 1.5). Net Payable = Gross Salary - Advance Deductions - Statutory Deductions.",
      errors: [
        ["ERR_DUPLICATE_PAYROLL", "A salary voucher has already been disbursed for this employee in this month.", "Edit existing payroll voucher."]
      ]
    },
    {
      key: "employees",
      file: "20_hr_employees.png",
      title: "HR Employee Directory & Staff Records",
      shortcut: "Alt + E",
      role: "All Roles (Role-Restricted Adjustments)",
      purpose: "Maintains workforce personnel master records, department assignments, biometric codes, Aadhaar KYC verification, base salary structures, and employment statuses.",
      fields: [
        ["Employee Code", "Text Input", "Required", "Unique personnel serial (e.g., EMP-0104)", "None"],
        ["Full Legal Name", "Text Input", "Required", "Employee legal name", "None"],
        ["Department", "Dropdown", "Required", "PRODUCTION, MAINTENANCE, WAREHOUSE, LOGISTICS, ACCOUNTS, SECURITY", "PRODUCTION"],
        ["Designation / Role", "Text Input", "Required", "Job title (e.g., Lead Injection Molding Operator)", "None"],
        ["Mobile Phone Number", "Text Input", "Required", "Active mobile contact number", "None"],
        ["Aadhaar Card Number", "Text Input", "Required for KYC", "12-digit Indian Aadhaar number", "None"],
        ["Base Monthly Wage (INR)", "Numeric Input", "Required", "Agreed monthly gross or daily base wage", "None"]
      ],
      sop: [
        "1. Open the HR Employee Directory (Alt + E).",
        "2. Click '+ Onboard New Employee'.",
        "3. Enter employee code, full legal name, department, and designation.",
        "4. Input mobile number, Aadhaar KYC number, and bank account for salary remittance.",
        "5. Set the base salary structure and joining date.",
        "6. Save employee profile to activate shift logging and payroll inclusion."
      ],
      math: "Workforce Count = Sum of active employees where active = true. Department Headcount = Count grouped by department.",
      errors: [
        ["ERR_DUPLICATE_EMP_CODE", "An employee with this personnel code already exists.", "Assign unique employee code."]
      ]
    },
    {
      key: "reports",
      file: "21_executive_reports.png",
      title: "Executive BI Management Reports & Export Engine",
      shortcut: "Alt + R",
      role: "MANAGER, ACCOUNTANT, ADMIN, SUPER_ADMIN",
      purpose: "Generates analytical business intelligence management reports covering monthly sales performance, plant production OEE, raw material consumption, customer balances, and GST tax liability registers.",
      fields: [
        ["Report Category", "Dropdown Selector", "Required", "SALES_SUMMARY, PRODUCTION_OEE, INVENTORY_VALUATION, CUSTOMER_LEDGER, GST_GSTR1_SUMMARY", "SALES_SUMMARY"],
        ["Date From / Date To", "Date Pickers", "Required", "Custom reporting time window", "Current Month"],
        ["Export Format", "Action Selector", "Optional", "Download PDF, Export Excel (.xlsx), Print Summary", "PDF"]
      ],
      sop: [
        "1. Navigate to Executive Reports using Alt + R.",
        "2. Choose the desired report category from the dropdown menu.",
        "3. Specify the date range window.",
        "4. Click 'Generate Report'. The system compiles database records and renders a formatted preview table.",
        "5. Click 'Export to Excel' for detailed spreadsheet auditing or 'Print PDF Report' for executive presentation."
      ],
      math: "Turnover Growth Rate % = ((Current Period Sales - Previous Period Sales) / Previous Period Sales) * 100. Scrap Valuation Loss = Scrap Weight (kg) * Raw Material Cost Per kg.",
      errors: [
        ["ERR_EMPTY_REPORT_PERIOD", "No transactional records found within the specified date boundaries.", "Adjust date range filter."]
      ]
    },
    {
      key: "analytics",
      file: "22_production_analytics.png",
      title: "Power BI Style Executive Analytics & KPI Suite",
      shortcut: "Alt + A",
      role: "MANAGER, ACCOUNTANT, ADMIN, SUPER_ADMIN",
      purpose: "Delivers an interactive, visual business intelligence suite featuring interactive trend charts, machine OEE performance gauges, cost breakdown donuts, and customer revenue ranking matrices.",
      fields: [
        ["Analytics Dimension", "Tab Selector", "Optional", "Overview, Revenue & Margin, Machine Efficiency, Polymer Yield", "Overview"],
        ["Time Granularity", "Dropdown", "Optional", "Daily Velocity, Weekly Run-Rate, Monthly Aggregate", "Monthly Aggregate"]
      ],
      sop: [
        "1. Open the Analytics & KPIs module (Alt + A).",
        "2. Interact with the Monthly Revenue Trend chart to inspect sales progression.",
        "3. Review the Machine OEE Performance gauge to identify factory bottleneck lines.",
        "4. Inspect the Polymer Yield & Scrap Loss breakdown donut chart.",
        "5. Use the Customer Revenue Matrix to view top revenue-generating cooperative accounts."
      ],
      math: "Gross Profit Margin % = ((Total Sales - Direct Raw Material Cost - Direct Factory Overhead) / Total Sales) * 100.",
      errors: [
        ["WARN_INCOMPLETE_TELEMETRY", "Telemetry stream temporarily paused during shift transition.", "Metrics resume automatically upon next shift log."]
      ]
    },
    {
      key: "audit-logs",
      file: "23_security_audit_logs.png",
      title: "Zero-Trust Security Audit Trail & Forensic Log",
      shortcut: "Nav Menu",
      role: "SUPER_ADMIN Only",
      purpose: "Provides an immutable, tamper-evident forensic activity log tracking every authentication event, user creation, privilege elevation, invoice deletion attempt, and database state mutation.",
      fields: [
        ["Action Type Filter", "Dropdown", "Optional", "LOGIN_SUCCESS, LOGIN_FAIL, INVOICE_CREATED, STOCK_ADJUSTED, BACKUP_COMPLETED", "All Actions"],
        ["User Filter", "Dropdown / Text", "Optional", "Filter activity by specific operator or administrator username", "All Users"],
        ["Search Query", "Text Input", "Optional", "Search details, IP addresses, or entity IDs", "None"]
      ],
      sop: [
        "1. Access the Security Audit Logs module (Super Admin credentials required).",
        "2. Review chronological log stream showing timestamp, executing username, action code, and client IP address.",
        "3. Click on any log row to inspect detailed forensic JSON payload containing before/after states.",
        "4. Use the Action Type filter to inspect security-sensitive operations (e.g., privilege updates or failed login attempts).",
        "5. Click 'Export Audit Certificate' to generate an encrypted compliance archive."
      ],
      math: "Audit Integrity Checksum: Hash_Chain(n) = SHA256(Hash_Chain(n-1) + Log_Payload(n)). Verifies log chain has not been tampered with.",
      errors: [
        ["ERR_FORBIDDEN_AUDIT_ACCESS", "Access restricted to Super Administrator role.", "Requires formal elevation in System Settings."]
      ]
    },
    {
      key: "settings",
      file: "24_settings_control_center.png",
      title: "Settings, Multi-Tenant White-Label & RBAC Control",
      shortcut: "Nav Menu",
      role: "SUPER_ADMIN & ADMIN",
      purpose: "Central administrative control console managing corporate entity profiles, GSTIN details, thermal printer invoice sizes, custom white-label branding (colors/logo), user accounts, and database backup schedules.",
      fields: [
        ["Company Legal Name", "Text Input", "Required", "Registered enterprise name printed on all tax invoices", "Futane Agro Industries Pvt. Ltd."],
        ["Factory GSTIN", "Text Input", "Required", "Official 15-digit Goods & Services Tax Identification Number", "27AAACF1234M1Z5"],
        ["Default Invoice Prefix", "Text Input", "Required", "Sequential invoice numbering prefix (e.g., INV-)", "INV-"],
        ["Invoice Thermal Print Width", "Dropdown", "Required", "Standard A4 Full Sheet or 80mm POS Thermal Receipt", "A4 Full Sheet"],
        ["White-Label Brand Color", "Color Picker", "Optional", "Hex code for custom navigation theme (e.g., #2563eb)", "#2563eb"],
        ["Company Logo Upload", "File / Base64", "Optional", "High-resolution SVG or PNG logo resource", "logo.svg"],
        ["Database Backup Action", "Action Button", "Optional", "Triggers immediate full PostgreSQL database snapshot", "None"]
      ],
      sop: [
        "1. Open the Settings & White-Label Control Center.",
        "2. Under the 'Company Profile' tab, update enterprise contact details, factory address, and GSTIN.",
        "3. Under 'White-Label Branding', select custom brand accent colors and upload corporate logo.",
        "4. Under 'User Management', provision new user accounts and assign appropriate RBAC roles.",
        "5. Under 'Database Backups', review automated backup history and click 'Trigger Manual Backup' before conducting major software updates."
      ],
      math: "Backup Compression Ratio = (Compressed Archive Size / Raw SQL Dump Size) * 100. Typically 18% to 22% of uncompressed footprint.",
      errors: [
        ["ERR_INVALID_GSTIN", "Company GSTIN entered does not conform to 15-character statutory format.", "Correct the GSTIN number before saving profile."]
      ]
    }
  ];

  let html = `
  <div>
    <h2 class="volume-title">Volume IV: Visual UI Directory & Tab-by-Tab Master Operating Manual</h2>
    
    <h3 class="chapter-title">Chapter 1: Frontend User Interface Architecture</h3>
    <p>
      The Futane Agro ERP user interface is engineered as a responsive, high-performance Single Page Application (SPA) built on <strong>Angular 18</strong> with standalone components, lazy-loaded deferrable views (<code>@defer</code>), and a zero-dependency Vanilla CSS design system.
    </p>
    <p>
      The interface is structured into <strong>23 dedicated functional modules</strong> plus the Zero-Trust Authentication Gateway. Every screen is strictly optimized for fast keyboard navigation, high data load tables (debounced search, trackBy identity tracking), and consistent enterprise aesthetics.
    </p>
    <p>
      Below is the complete, tab-by-tab operational manual for all 24 screens. Each module entry incorporates a distinct high-resolution screen capture, functional scope overview, UI field dictionary, step-by-step operating procedure, mathematical calculation formulas, and validation error resolutions.
    </p>
  `;

  for (let i = 0; i < tabDefs.length; i++) {
    const tab = tabDefs[i];
    const fileUrl = `http://127.0.0.1:4300/docs/screenshots/${tab.file}`;

    // PAGE 1: Visual Interface, Component Architecture & Scope
    html += `
    <div class="page-break"></div>
    <div class="avoid-break" style="padding-top: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2.5px solid #2563eb; padding-bottom: 6px;">
        <h3 style="font-size: 14pt; font-weight: 800; color: #0f172a; margin: 0;">
          Module ${i + 1}: ${tab.title}
        </h3>
        <div style="display: flex; gap: 6px;">
          <span class="badge badge-post">${tab.shortcut}</span>
          <span class="badge badge-role">${tab.role}</span>
        </div>
      </div>

      <div class="screenshot-container" style="margin-top: 12px; margin-bottom: 12px;">
        <img src="${fileUrl}" alt="${tab.title}" class="screenshot-img" style="max-height: 420px;" />
        <div class="screenshot-caption">Figure ${i + 1}.1: Verified User Interface Capture — ${tab.title} (${tab.file})</div>
      </div>

      <h4 class="section-title">1. Functional Purpose & Business Domain Scope</h4>
      <p style="font-size: 9pt; line-height: 1.5;">${tab.purpose}</p>

      <h4 class="section-title">2. Component Architecture & State Management</h4>
      <table class="spec-table">
        <thead>
          <tr>
            <th>Architecture Layer</th>
            <th>Implementation Detail</th>
            <th>Performance Invariant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Component Selector</td>
            <td><code>app-${tab.key}</code></td>
            <td>Angular 18 Standalone Component with Deferrable Loading (<code>@defer</code>)</td>
          </tr>
          <tr>
            <td>Template Path</td>
            <td><code>src/app/components/features/${tab.key}/${tab.key}.component.html</code></td>
            <td>Zero external CSS framework dependencies; Vanilla CSS design system</td>
          </tr>
          <tr>
            <td>State Management</td>
            <td><code>ApiService</code>, <code>TerminologyService</code>, <code>NotificationService</code></td>
            <td>Strict RxJS hygiene: <code>shareReplay({ bufferSize: 1, refCount: true })</code></td>
          </tr>
          <tr>
            <td>Data Table Rendering</td>
            <td>Virtual Pagination + 300ms Input Debounce</td>
            <td>Mandatory <code>trackBy: trackById</code> identity function to prevent DOM recreation</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGE 2: Form Field Dictionary & Standard Operating Procedure -->
    <div class="page-break"></div>
    <div class="avoid-break" style="padding-top: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1.5px solid #64748b; padding-bottom: 4px; margin-bottom: 12px;">
        <h4 style="font-size: 11pt; font-weight: 700; color: #1e3a8a; margin: 0;">
          Module ${i + 1} (Contd.): Form Dictionary & Operating Procedure — ${tab.title}
        </h4>
        <span class="badge badge-role">Page 2 of 3</span>
      </div>

      <h4 class="section-title" style="margin-top: 0;">3. UI Form & Table Data Field Dictionary</h4>
      <p style="font-size: 8.5pt; color: #64748b; margin-bottom: 6px;">
        The table below documents every interactive form input, table column, constraint, validation pattern, and default value implemented in this module.
      </p>

      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 25%;">Field Name</th>
            <th style="width: 20%;">Input Type</th>
            <th style="width: 15%;">Requirement</th>
            <th style="width: 25%;">Validation Constraints</th>
            <th style="width: 15%;">Default Value</th>
          </tr>
        </thead>
        <tbody>
          ${tab.fields.map(f => `
            <tr>
              <td><strong>${f[0]}</strong></td>
              <td><code>${f[1]}</code></td>
              <td><span class="badge ${f[2].includes('Required') ? 'badge-delete' : 'badge-get'}">${f[2]}</span></td>
              <td>${f[3]}</td>
              <td><code>${f[4]}</code></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h4 class="section-title">4. Step-by-Step Standard Operating Procedure (SOP)</h4>
      <p style="font-size: 8.5pt; color: #64748b; margin-bottom: 6px;">
        Authorized operators and administrators must follow the standardized operational workflow outlined below:
      </p>

      <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; font-size: 8.5pt; line-height: 1.55;">
        ${tab.sop.map(s => `<p style="margin-bottom: 6px;">${s}</p>`).join('')}
      </div>
    </div>

    <!-- PAGE 3: Math Formulas, Validation Errors & Security Matrix -->
    <div class="page-break"></div>
    <div class="avoid-break" style="padding-top: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1.5px solid #64748b; padding-bottom: 4px; margin-bottom: 12px;">
        <h4 style="font-size: 11pt; font-weight: 700; color: #1e3a8a; margin: 0;">
          Module ${i + 1} (Contd.): Mathematical Invariants & Error Encyclopedia — ${tab.title}
        </h4>
        <span class="badge badge-role">Page 3 of 3</span>
      </div>

      <h4 class="section-title" style="margin-top: 0;">5. Mathematical Invariants, Calculation Formulas & Ledger Logic</h4>
      <p style="font-size: 8.5pt; color: #64748b; margin-bottom: 6px;">
        Every financial calculation, scrap ratio, tax split, and inventory balance mutation is governed by deterministic mathematical invariants:
      </p>
      <div class="callout callout-info" style="font-size: 8.5pt; line-height: 1.5;">
        ${tab.math}
      </div>

      <h4 class="section-title">6. Tab Validation, Security Controls & Error Encyclopedia</h4>
      <p style="font-size: 8.5pt; color: #64748b; margin-bottom: 6px;">
        The table below catalogs common runtime exceptions, field validation failures, root causes, and verifiable corrective procedures:
      </p>

      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 25%;">Error Code</th>
            <th style="width: 35%;">Triggering Condition / Root Cause</th>
            <th style="width: 40%;">Standard Operating Corrective Action</th>
          </tr>
        </thead>
        <tbody>
          ${tab.errors.map(e => `
            <tr>
              <td><code>${e[0]}</code></td>
              <td><strong>${e[1]}</strong></td>
              <td><em>Resolution:</em> ${e[2]}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h4 class="section-title">7. Security Auditing & RBAC Authorization Invariants</h4>
      <table class="spec-table">
        <thead>
          <tr>
            <th>Security Domain</th>
            <th>Enforcement Policy</th>
            <th>Audit Log Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Role Authorization</td>
            <td>Role prerequisite: <code>${tab.role}</code></td>
            <td>Unauthorized access attempts trigger HTTP 403 Forbidden + Audit Log</td>
          </tr>
          <tr>
            <td>Audit Trail Code</td>
            <td><code>${tab.key.toUpperCase()}_MUTATED</code></td>
            <td>Captures executing user, IP address, timestamp, and modified fields</td>
          </tr>
          <tr>
            <td>Data Sanitization</td>
            <td>XSS prevention via Angular <code>DomSanitizer</code></td>
            <td>All user-supplied text inputs sanitized against script injection</td>
          </tr>
        </tbody>
      </table>
    </div>
    `;
  }

  html += `
  </div>
  `;

  return html;
}
