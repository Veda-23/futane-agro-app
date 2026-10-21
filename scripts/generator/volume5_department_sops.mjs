export function generateVolume5() {
  const sops = [
    {
      num: "SOP-01",
      title: "Injection Molding Plant Floor Shift Execution & Scrap Quality Control SOP",
      dept: "Manufacturing & Plant Engineering",
      objective: "To standardize the start-up, shift run, quality inspection, and scrap logging procedures for heavy-duty plastic crate injection molding machines.",
      scope: "Applies to all shift operators, technicians, and plant floor supervisors operating machines M-01, M-02, and M-03.",
      steps: [
        "1. Shift Handover & Machine Inspection: The incoming shift operator verifies hydraulic oil levels, chiller water temperature (12°C - 15°C), and barrel heater zone temperatures (210°C - 235°C for Polypropylene).",
        "2. Hopper Feed & Granule Intake: Ensure virgin PP granules and color masterbatch (1.5% - 2.0% ratio) are properly blended and loaded into the machine vacuum hopper dryer.",
        "3. First Shot Quality Verification: Inspect the first 3 molded crates for sink marks, short shots, flash, or color streaking. Measure dimensional tolerance across top lip and base ribs (+/- 1.5mm standard).",
        "4. Continuous Production Run: Monitor automated cycle time (42 seconds for 500ml crates, 52 seconds for 1L agro crates). Crates are ejected onto the conveyor belt.",
        "5. De-Gating & Flash Trimming: Operator trims sprue vestige cleanly using safety de-burring knives. Trimmings are immediately deposited into color-coded regrind bins.",
        "6. Defect Segregation & Scrap Logging: Any defective crate (cold weld line, air trap, severe warpage) is set aside, weighed on the digital floor scale, and recorded under 'Rejected Crates'.",
        "7. End-of-Shift ERP Entry: Log into the ERP Daily Production (PPD) tab. Record shift, machine, raw material consumed, successful crate count, and scrap weight. Submit record for shift supervisor sign-off."
      ],
      compliance: "Zero-tolerance for untracked scrap. All sprues and rejects must be 100% accounted for to maintain resin yield reconciliations."
    },
    {
      num: "SOP-02",
      title: "Monthly Production Planning & Granule Quota Allocation SOP",
      dept: "Production Planning & Control (PPC)",
      objective: "To establish monthly production volume targets, balance mold cycle allocations across available machines, and allocate required polymer raw material feedstock.",
      scope: "Applies to the Plant General Manager, Production Planning Officer, and Procurement Head.",
      steps: [
        "1. Demand Aggregation: Review pending sales orders and forecast demand from wholesale agricultural cooperatives by crate variant (500ml, 1L, 2L).",
        "2. Machine Capacity Balancing: Calculate available machine running hours across 3 shifts per day (allowing 24 hours per month for planned preventative maintenance per machine).",
        "3. Target Setting in ERP: Access the Monthly Production (PPM) module. Enter planned monthly targets by crate variant and target OEE efficiency (minimum 92.5%).",
        "4. Granule Feedstock Budgeting: Multiply target crate count by standard finished crate shot weight plus 2.5% allowable sprue/trimming buffer to calculate total required PP granules.",
        "5. Purchase Requisition Trigger: Verify current warehouse polymer stock against allocated requirement. If shortfall exists, trigger an immediate Purchase Requisition to approved vendors.",
        "6. Executive Approval: Submit monthly PPM plan for Director sign-off to activate live daily PPD progress tracking."
      ],
      compliance: "Monthly production quotas must not exceed 90% of rated nameplate machine capacity to prevent catastrophic equipment over-stress."
    },
    {
      num: "SOP-03",
      title: "Raw Material Warehouse Intake, Moisture Testing & Reorder SOP",
      dept: "Stores & Warehouse Management",
      objective: "To ensure rigorous quality inspection, weighbridge verification, moisture testing, and system receipt of incoming polymer granules.",
      scope: "Applies to Warehouse Storekeepers, Quality Control Inspectors, and Security Gate Staff.",
      steps: [
        "1. Vehicle Gate Arrival: Incoming truck loaded with PP granules arrives at factory gate. Security logs vehicle registration, vendor delivery challan, and manufacturer refinery batch certificate.",
        "2. Weighbridge Inward Weighment: Truck drives onto calibrated electronic weighbridge to record Gross Weight.",
        "3. Bag Inspection & Sampling: Storekeeper inspects 25kg bags for tearing, moisture ingress, or seal tampering. Take random 100g sample from 5 bags across the consignment.",
        "4. Laboratory Moisture Test: QC lab tests moisture content using halogen moisture analyzer. Maximum permissible moisture content for Polypropylene injection molding is 0.08%. Consignments exceeding 0.10% are strictly rejected.",
        "5. Unloading & Tare Weighment: Unload bags onto wooden pallets in dry, covered raw material warehouse (maximum 20 bags high per pallet). Truck re-weighs to determine Tare Weight.",
        "6. ERP Stock Posting: Storekeeper opens Raw Materials tab in ERP. Record vendor, batch lot number, verified net weight, and landed purchase price per kg. System immediately updates available stock balance."
      ],
      compliance: "Every granule batch must have a verified manufacturer test certificate (MTC) archived before release to the plant floor."
    },
    {
      num: "SOP-04",
      title: "Customer Sales Order Booking & Credit Limit Validation SOP",
      dept: "Commercial Sales & Accounts",
      objective: "To govern the booking of commercial sales orders, verification of customer credit limits, and delivery schedule commitment.",
      scope: "Applies to Commercial Sales Executives, Key Account Managers, and Finance Officers.",
      steps: [
        "1. Inbound Order Receipt: Customer purchase order (PO) received via email, phone, or customer web portal specifying crate variant, color, quantity, and required delivery date.",
        "2. Credit & Ledger Review: Sales executive opens Customer Directory (CRM) in ERP. Check customer's approved credit limit and current live outstanding balance.",
        "3. Credit Check Policy: If the value of the new order plus current outstanding balance exceeds the approved credit limit, the order cannot be approved without written Director authorization or immediate payment receipt.",
        "4. Sales Order Creation: Access Sales Orders tab (Alt + S). Select customer party, crate model, agreed unit rate, and target delivery deadline.",
        "5. Statutory Tax Validation: System automatically computes 18% GST (CGST 9% + SGST 9% or IGST 18%). Review subtotal and grand total.",
        "6. Order Confirmation & Queueing: Click 'Confirm Sales Order'. The order transitions to CONFIRMED status and appears in the finished goods dispatch picking queue."
      ],
      compliance: "No sales order may be booked at rates below minimum floor manufacturing cost without executive management override."
    },
    {
      num: "SOP-05",
      title: "Finished Goods Warehouse Storage & FIFO Dispatch Picking SOP",
      dept: "Finished Goods Warehouse",
      objective: "To maintain structured pallet storage of finished molded crates and enforce First-In, First-Out (FIFO) dispatch picking to prevent UV degradation.",
      scope: "Applies to Finished Goods Storekeepers, Forklift Drivers, and Dispatch Loading Staff.",
      steps: [
        "1. Plant Floor Transfer: Freshly molded and quality-approved crates are transferred from the production lines to the finished goods staging area.",
        "2. Pallet Stacking & Tagging: Stack crates in interlocking patterns on standard 1200x1000mm industrial pallets (standard pallet count: 120 crates for 500ml dairy crates, 80 crates for 1L crates).",
        "3. Bay Placement: Forklift transports pallet to assigned warehouse rack bay (e.g., BAY-A-01 for 500ml Dairy Blue). Storekeeper logs bay code in ERP Finished Inventory tab.",
        "4. Picking for Dispatch: When a sales order is queued for dispatch, storekeeper selects crates following strict FIFO principles based on earliest production date.",
        "5. Pre-Loading Visual Check: Inspect crates for dust accumulation, rib cracks, or strap damage. Defective units are rejected back to plant floor for credit.",
        "6. Loading Dock Handover: Move selected pallets to loading bay. Count verified jointly by warehouse storekeeper and commercial transport driver."
      ],
      compliance: "Pallet stacks must not exceed 2.4 meters height to ensure warehouse structural safety and prevent crate base deformation."
    },
    {
      num: "SOP-06",
      title: "Logistics Dispatch, Vehicle Weighbridge Gate Pass & E-Way Bill SOP",
      dept: "Logistics & Factory Security",
      objective: "To execute vehicle inspection, gate weighment, driver KYC verification, E-Way Bill matching, and official outward gate pass issuance.",
      scope: "Applies to Logistics Officers, Security Gate Guards, and Weighbridge Operators.",
      steps: [
        "1. Truck Arrival & Cleanliness Inspection: Transport truck arrives at loading dock. Logistics officer inspects truck cargo bed for cleanliness, protruding nails, or moisture that could damage plastic crates.",
        "2. Driver Verification: Verify driver's commercial HMV driving license in ERP Driver Registry. Check driver KYC details.",
        "3. Tare Weighment: Truck drives onto weighbridge to record empty Tare Weight. Printed weighbridge ticket generated.",
        "4. Loading & Crate Count: Crates loaded onto truck bed and secured using nylon tie-down straps and protective tarpaulin.",
        "5. Gross Weighment: Fully loaded truck drives back onto weighbridge. Record Gross Weight. System calculates Net Cargo Weight.",
        "6. E-Way Bill Generation: If invoice grand total exceeds INR 50,000, verify active Government E-Way Bill number in ERP. Ensure Part-B vehicle number matches the physical truck registration plate exactly.",
        "7. Gate Pass Authorization: Logistics officer opens Dispatch module in ERP. Generate sequential Outward Gate Pass (e.g., GP-2026-0811). Print 2 copies (1 copy for driver, 1 copy for security gate register). Security guard inspects pass and opens gate."
      ],
      compliance: "No vehicle may leave the factory perimeter without an authorized ERP gate pass, matching weighbridge ticket, and valid E-Way Bill."
    },
    {
      num: "SOP-07",
      title: "GST Tax Invoice Issuance, HSN 3923 Compliance & Ledger Reconciliation SOP",
      dept: "Finance & Taxation",
      objective: "To govern statutory tax invoicing under Indian Goods & Services Tax laws, HSN 3923 compliance, customer ledger postings, and monthly GSTR-1 reconciliation.",
      scope: "Applies to Chief Financial Officer, Senior Accountants, and Billing Clerks.",
      steps: [
        "1. Dispatch Linking: Open GST Invoices module in ERP. Select the authorized outward gate pass dispatch record to import verified customer, crate model, and quantity.",
        "2. Statutory HSN Verification: Confirm line item HSN code is strictly 3923 ('Articles for the conveyance or packing of goods, of plastics').",
        "3. Tax Structure Determination: Check customer party GSTIN state code: If Maharashtra (State Code 27), apply CGST 9.00% + SGST 9.00%. If other state, apply IGST 18.00%.",
        "4. Invoice Generation & Finalization: Click 'Generate Invoice'. The system assigns the next sequential tax invoice number (e.g., INV-2026-0512), applies rounding to nearest integer on grand total, and posts debit to customer's ledger.",
        "5. Document Distribution: Print 3 official A4 copies: Original for Recipient, Duplicate for Transporter, Triplicate for Supplier. Email signed digital PDF copy to customer billing desk.",
        "6. Monthly GSTR-1 Reconciliation: At the end of each tax period, export GSTR-1 Summary from Executive Reports module. Reconcile total taxable turnover and GST collected against the government GST portal."
      ],
      compliance: "Invoice numbers must be strictly sequential with no gaps or back-dating. Invoices once finalized cannot be deleted; adjustments must proceed via Credit/Debit Notes."
    },
    {
      num: "SOP-08",
      title: "Workforce Shift Scheduling, Biometric Overtime & Monthly Payroll SOP",
      dept: "Human Resources & Payroll",
      objective: "To manage factory workforce attendance, calculate overtime earnings, process statutory deductions, and disburse monthly employee salaries.",
      scope: "Applies to HR Officers, Plant Timekeepers, and Finance Payroll Clerks.",
      steps: [
        "1. Daily Biometric Timekeeping: Factory employees log attendance on optical biometric punch terminals upon entering and exiting plant premises.",
        "2. Daily Muster Verification: HR timekeeper reviews daily attendance logs in ERP HR module, verifying shift coverage across all 3 production shifts.",
        "3. Overtime Authorization: Any overtime hours logged must have prior written plant supervisor authorization slip filed with HR.",
        "4. Month-End Payroll Run: On the 1st of each month, open Workforce Payroll & Salaries module in ERP.",
        "5. Wage Calculation: For each employee, verify total days worked and approved overtime hours. The system computes daily rate (Base Salary / 26 days) and overtime earnings (1.5x standard hourly rate).",
        "6. Advance & Deduction Reconciliation: Input any salary advance recovery deductions or statutory deductions.",
        "7. Salary Voucher Generation & Disbursement: Generate payroll disbursement vouchers. Prepare bank NEFT/RTGS salary transfer upload file. Once transferred, mark status as PAID and print employee salary pay slips."
      ],
      compliance: "All workforce overtime payments must adhere strictly to statutory Indian Factories Act labor regulations."
    },
    {
      num: "SOP-09",
      title: "Preventative Machine Maintenance, Hydraulic Oil Overhaul & Mold Breakdown SOP",
      dept: "Plant Maintenance & Engineering",
      objective: "To standardize preventative maintenance schedules for injection molding machines, hydraulic oil filtration, chiller upkeep, and mold breakdown repairs.",
      scope: "Applies to Maintenance Engineers, Millwright Technicians, and Tool Room Die Fitters.",
      steps: [
        "1. Weekly Preventative Maintenance: Inspect machine toggle lubrication grease levels, hydraulic hose fittings for micro-leaks, and heater band electrical terminal tightness.",
        "2. Monthly Hydraulic Oil Quality Analysis: Sample hydraulic oil from main machine reservoirs. Test viscosity and particulate contamination. Replace offline micro-filters if pressure differential exceeds 1.8 bar.",
        "3. Mold Care & Die Cleaning: When switching crate molds, inspect mold core and cavity surfaces for polymer residue or rust. Clean surfaces using approved mold cleaner spray and apply anti-corrosion protective coating.",
        "4. Breakdown Handling Protocol: In the event of an unplanned machine fault, operator triggers emergency stop and informs maintenance desk. Maintenance engineer records stoppage time in Breakdown Registry.",
        "5. Root Cause Rectification: Diagnose fault using machine PLC alarms (e.g., Heater Band Open Circuit, Mold Protection Interlock, Hydraulic Pressure Drop). Execute repairs.",
        "6. Restored Sign-Off: Once machine tests successfully on dry cycle, log restored time, replaced parts cost, and root cause in ERP. Machine status returns to RUNNING."
      ],
      compliance: "Safety interlocks (front gate electrical limit switch and hydraulic safety valve) must be physically tested daily and never bypassed."
    },
    {
      num: "SOP-10",
      title: "Multi-Tenant White-Labeling, Custom Branding & Corporate Rebranding SOP",
      dept: "System Administration & Executive IT",
      objective: "To configure white-label branding, upload custom corporate SVG/PNG logos, adjust primary color theme palettes, and configure tenant entity profiles.",
      scope: "Applies exclusively to Super Administrators and Enterprise IT Officers.",
      steps: [
        "1. Admin Console Access: Log in as SUPER_ADMIN and navigate to Settings Control Center.",
        "2. Entity Profile Customization: Select 'White-Label & Branding' tab.",
        "3. Corporate Name Update: Enter new trading entity legal name (e.g., 'Futane Agro Industries Pvt. Ltd.' or custom client enterprise name).",
        "4. Custom Color Palette Selection: Use the hex color picker to set primary brand theme accent (e.g., #2563eb Blue, #16a34a Green, #7c3aed Purple). The entire UI adapts instantaneously.",
        "5. Logo Asset Upload: Upload corporate SVG or PNG logo resource (recommended resolution 512x512 pixels). System stores logo in encrypted asset vault.",
        "6. Document Header Configuration: Verify updated logo, trading name, and GSTIN formatting in invoice preview modal.",
        "7. Save & Deploy: Click 'Save White-Label Configuration'. All connected client sessions receive real-time branding updates."
      ],
      compliance: "White-label customizations must preserve statutory legal GSTIN and corporate registered office details required by taxation authorities."
    },
    {
      num: "SOP-11",
      title: "Injection Mold Tool Maintenance, Ultrasonic De-Scaling & Cavity Overhaul SOP",
      dept: "Tool Room & Die Maintenance",
      objective: "To govern preventive maintenance, ultrasonic cleaning, ejector pin lubrication, and dimensional inspection of heavy multi-cavity crate molds.",
      scope: "Applies to Tool Room Engineers, Mold Technicians, and Machine Maintenance Fitters.",
      steps: [
        "1. Mold De-Mounting: When a production cycle quota completes or PM schedule fires, lock machine safety gates, isolate hydraulic cooling circuits, and affix mold lifting hoist shackles.",
        "2. Initial Visual Inspection: Inspect parting line surfaces, runner gates, and core cavity edges for scoring, burrs, or metal fatigue cracks.",
        "3. Ultrasonic De-Scaling: Disassemble cooling baffles and immerse core plates in ultrasonic cleaning tank with de-scaling solvent to remove calcium mineral scale.",
        "4. Ejector Mechanism Servicing: Remove all ejector pins, clean pin bores, verify stroke straightness, and apply high-temperature food-grade moly lubricant.",
        "5. Hot Runner Manifold Check: Test all electrical heating cartridge elements and thermocouples for proper resistance and ground insulation (minimum 10 Megaohms).",
        "6. Cavity Re-Assembly & Clamping Torque: Reassemble mold halves using torque wrenches calibrated to 450 Nm. Install mold alignment locks.",
        "7. ERP Maintenance Logging: Open Machines tab in ERP. Record maintenance hours, replaced components (springs, O-rings, heaters), and reset the mold shot counter."
      ],
      compliance: "No mold may exceed 100,000 continuous shots without full preventative overhaul and ultrasonic water channel de-scaling."
    },
    {
      num: "SOP-12",
      title: "Masterbatch Pigment Formulation, Color Matching & Spectrophotometer Approval SOP",
      dept: "Quality Assurance & Color Lab",
      objective: "To standardize color masterbatch blending ratios, achieve uniform pigment dispersion, and verify Delta-E chromaticity standards for agricultural crates.",
      scope: "Applies to QA Laboratory Technicians, Polymer Chemists, and Plant Shift Supervisors.",
      steps: [
        "1. Recipe & Formulation Retrieval: Access ERP Settings tab. Retrieve approved masterbatch pigment ratios for target crate color (e.g., Agro Blue: 1.8% blue MB + 0.2% UV stabilizer).",
        "2. Micro-Weighment: Weigh exact masterbatch quantity using high-precision digital lab scale (+/- 0.01g precision).",
        "3. High-Speed Tumble Blending: Transfer virgin PP polymer granules and masterbatch into vertical tumble blender. Agitate for 8 minutes at 45 RPM to ensure uniform surface adhesion.",
        "4. Sample Plaque Molding: Inject 3 sample color test plaques on laboratory test press at standard 220°C barrel temperature.",
        "5. Spectrophotometer Reading: Place test plaque under calibrated D65 artificial daylight spectrophotometer. Measure CIE L*a*b* coordinates.",
        "6. Delta-E Tolerance Check: Compute total color deviation Delta-E against the master color standard. Maximum permissible Delta-E is 1.20 for commercial crates. Batches with Delta-E > 1.20 are rejected.",
        "7. ERP QC Clearance: Log color test report in ERP Quality Control repository and release masterbatch lot for full machine hopper feed."
      ],
      compliance: "UV stabilizer concentration must never fall below 0.20% by weight to ensure crates withstand 3 years of outdoor solar agricultural exposure."
    },
    {
      num: "SOP-13",
      title: "In-House Polymer Scrap Regrind, Metal Detection & Blending SOP",
      dept: "Recycling & Materials Recovery",
      objective: "To govern the granulation of plant-generated rejected crates and sprues, metal contamination screening, and controlled re-introduction into secondary production.",
      scope: "Applies to Granulator Operators, Recycling Section Supervisors, and Material Handlers.",
      steps: [
        "1. Scrap Segregation by Color & Polymer: Segregate rejected crates and trimmings into dedicated color-coded bins (Blue, Green, Red, Yellow). Mixing colors or polymers is strictly prohibited.",
        "2. Manual De-Contamination: Inspect scrap pieces for foreign contaminants, paper labels, grease, or dirt. Wipe clean with solvent.",
        "3. Heavy-Duty Granulation: Feed sorted crates into 50 HP granulator equipped with 8mm screen mesh. Ensure soundproof enclosure is securely clamped.",
        "4. Magnetic Separation & De-Dusting: Granulated flakes pass through rare-earth neodymium magnetic cross-belt separator to extract any tramp iron, followed by cyclone de-dusting to remove fines.",
        "5. Moisture & Bulk Density Testing: Measure regrind bulk density and moisture. Pass flakes through dehumidifying hopper if moisture exceeds 0.05%.",
        "6. Controlled Blender Metering: Load regrind into auxiliary hopper doser. Set maximum blend ratio to 15.0% regrind blended with 85.0% virgin polymer for structural crates.",
        "7. ERP Scrap Reclaim Posting: Open Raw Materials tab in ERP. Post converted scrap weight from 'Scrap Inventory' into 'Regrind Inventory' with landed reclaim cost basis."
      ],
      compliance: "Regrind ratio must never exceed 15% for heavy-duty load-bearing agricultural crates to prevent drop-impact brittle cracking."
    },
    {
      num: "SOP-14",
      title: "Customer Cheque Clearing, Dishonor Handling & Legal Escalation SOP",
      dept: "Accounts Receivable & Credit Control",
      objective: "To standardize the receipt, banking, reconciliation, and legal dispute escalation for customer payment cheques.",
      scope: "Applies to Accounts Receivable Clerks, Credit Control Managers, and Company Legal Counsel.",
      steps: [
        "1. Cheque Inward Logging: Receive physical payment cheque from customer or sales representative. Log cheque number, date, issuing bank, drawee branch, and amount in ERP Payments module.",
        "2. Deposit & Pay-in Slip Generation: Generate bank pay-in slip in ERP. Deposit physical cheque into authorized company clearing account within 24 hours of receipt.",
        "3. Real-Time Bank Clearing: Upon bank clearance notification, open Bank Accounts module. Mark cheque voucher as CLEARED. System automatically posts credit to customer ledger balance.",
        "4. Dishonor / Bounce Notification: If bank returns cheque unpaid (insufficient funds, signature mismatch, stop payment), mark voucher as DISHONORED in ERP.",
        "5. Automated Reversal & Penalty: ERP automatically reverses credit to customer ledger and debits statutory INR 750 dishonor administrative fee to customer account.",
        "6. Formal Demand Notice: If payment is not received via NEFT/RTGS within 48 hours of dishonor, generate formal Statutory Demand Notice under Section 138 of Negotiable Instruments Act.",
        "7. Credit Freeze & Legal Escalation: Automatically lock customer account in ERP to prevent further dispatches until legal dispute or settlement is resolved."
      ],
      compliance: "Accounts with dishonored instruments must be immediately frozen for credit dispatches across all factory sales channels."
    },
    {
      num: "SOP-15",
      title: "Annual Physical Stock Taking (PST), Inventory Valuation & Variance Audit SOP",
      dept: "Internal Audit & Finance",
      objective: "To execute year-end physical inventory counting, verify book vs physical quantities, calculate inventory valuation under Ind AS 2, and post audit adjustments.",
      scope: "Applies to Statutory Auditors, Internal Audit Team, Inventory Managers, and Chief Financial Officer.",
      steps: [
        "1. Factory Floor Freeze: Schedule physical stock count on the final weekend of the financial year. Freeze all inward receipts and outward dispatches in ERP.",
        "2. Tag & Count Team Formation: Deploy two-member counting teams (one operations staff, one independent finance auditor) assigned to distinct warehouse bays.",
        "3. Physical Piece Count: Physically count crates by model, pallet, and bay. Affix serialized fluorescent audit stickers to counted pallets.",
        "4. Raw Material & Granule Silo Weighment: Weigh polymer granule bags in warehouse. Measure silo levels using ultrasonic level transducers and calculate bulk density tonnage.",
        "5. Variance Reconciliation: Enter physical counts into ERP Physical Stock Taking reconciliation worksheet. System computes book vs physical variance quantity and percentage.",
        "6. Root-Cause Analysis: For any variance exceeding 0.5% of total stock, conduct physical recount and audit machine shift scrap logs.",
        "7. Valuation & Ledger Adjustment: Value audited inventory at Lower of Cost or Net Realizable Value (NRV) in compliance with Ind AS 2. Submit audit report for Board approval and post closing inventory entries."
      ],
      compliance: "All physical stock sheets must be signed jointly by internal audit and external statutory auditors prior to unfreezing the ERP billing system."
    }
  ];

  let html = `
  <div>
    <h2 class="volume-title">Volume V: Plant Operations & Departmental Standard Operating Procedures (SOPs)</h2>
    
    <h3 class="chapter-title">Chapter 1: Departmental Operational Governance</h3>
    <p>
      The operational excellence of Futane Agro Industries Private Limited is governed by fifteen formal <strong>Standard Operating Procedures (SOP-01 through SOP-15)</strong>. These procedures establish strict operational discipline across plant floor injection molding, warehouse inventory management, logistics weighment, GST accounting compliance, mold toolroom maintenance, color matching, recycling, cheque credit control, and annual statutory inventory audit.
    </p>
    <p>
      Every department supervisor, engineer, and staff member is required to adhere strictly to the operational workflows, validation criteria, and compliance guardrails set forth below.
    </p>
  `;

  for (let i = 0; i < sops.length; i++) {
    const s = sops[i];
    // PAGE 1: Objectives, Scope, Tooling & Initial Procedure Steps
    html += `
    <div class="page-break"></div>
    <div class="avoid-break" style="padding-top: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2.5px solid #1e3a8a; padding-bottom: 6px;">
        <h3 style="font-size: 14pt; font-weight: 800; color: #1e3a8a; margin: 0;">
          ${s.num}: ${s.title}
        </h3>
        <span class="badge badge-role">${s.dept}</span>
      </div>

      <div class="grid-2" style="margin-top: 10px; margin-bottom: 10px;">
        <div class="card">
          <div class="card-title">Operational Objective</div>
          <p style="font-size: 8.5pt; margin: 0; line-height: 1.45;">${s.objective}</p>
        </div>
        <div class="card">
          <div class="card-title">Operational Scope & Applicability</div>
          <p style="font-size: 8.5pt; margin: 0; line-height: 1.45;">${s.scope}</p>
        </div>
      </div>

      <h4 class="section-title">1. Tooling, Machinery & Personal Protective Equipment (PPE)</h4>
      <table class="spec-table">
        <thead>
          <tr>
            <th>Equipment Category</th>
            <th>Approved Specification</th>
            <th>Safety Standard / Inspection Check</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Plant Floor Machinery</td>
            <td>Heavy Injection Molding Machine (250T - 650T)</td>
            <td>Safety limit switches & hydraulic interlocks verified daily</td>
          </tr>
          <tr>
            <td>Personal Protective Equipment (PPE)</td>
            <td>Heat-resistant gloves, steel-toe boots, safety goggles</td>
            <td>Mandatory compliance under Indian Factories Act 1948</td>
          </tr>
          <tr>
            <td>Calibration & Gauges</td>
            <td>Digital Vernier Caliper (+/- 0.02mm), Halogen Moisture Analyzer</td>
            <td>Calibrated semi-annually with traceable NABL certification</td>
          </tr>
        </tbody>
      </table>

      <h4 class="section-title">2. Standard Operating Workflow — Execution Steps</h4>
      <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; font-size: 8.5pt; line-height: 1.55;">
        ${s.steps.slice(0, 4).map(st => `<p style="margin-bottom: 6px;"><strong>${st.split(':')[0]}:</strong>${st.split(':').slice(1).join(':')}</p>`).join('')}
      </div>
    </div>

    <!-- PAGE 2: Procedure Continuation, RACI Matrix & Quality Protocol -->
    <div class="page-break"></div>
    <div class="avoid-break" style="padding-top: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1.5px solid #64748b; padding-bottom: 4px; margin-bottom: 12px;">
        <h4 style="font-size: 11pt; font-weight: 700; color: #1e3a8a; margin: 0;">
          ${s.num} (Contd.): Governance, RACI Matrix & Quality Compliance — ${s.title}
        </h4>
        <span class="badge badge-role">Page 2 of 2</span>
      </div>

      <h4 class="section-title" style="margin-top: 0;">2. Standard Operating Workflow (Contd.)</h4>
      <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; font-size: 8.5pt; line-height: 1.55; margin-bottom: 12px;">
        ${s.steps.slice(4).map(st => `<p style="margin-bottom: 6px;"><strong>${st.split(':')[0]}:</strong>${st.split(':').slice(1).join(':')}</p>`).join('')}
      </div>

      <h4 class="section-title">3. RACI Responsibility Governance Matrix</h4>
      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 35%;">Operational Milestone</th>
            <th style="width: 15%;">Responsible</th>
            <th style="width: 15%;">Accountable</th>
            <th style="width: 15%;">Consulted</th>
            <th style="width: 20%;">Informed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Operational Task Execution</td>
            <td>Shift Operator / Technician</td>
            <td>Plant Supervisor</td>
            <td>Maintenance Engineer</td>
            <td>Production Planning Desk</td>
          </tr>
          <tr>
            <td>Quality Check & Scrap Clearance</td>
            <td>QC Line Inspector</td>
            <td>Quality Assurance Head</td>
            <td>Tool Room Engineer</td>
            <td>Warehouse Storekeeper</td>
          </tr>
          <tr>
            <td>ERP Transaction Recording</td>
            <td>Executing User</td>
            <td>Department Manager</td>
            <td>Systems Administrator</td>
            <td>Executive Dashboard</td>
          </tr>
        </tbody>
      </table>

      <h4 class="section-title">4. Quality Acceptance & Non-Conformance Escalation</h4>
      <table class="spec-table">
        <thead>
          <tr>
            <th>Quality Metric</th>
            <th>Acceptance Threshold</th>
            <th>Non-Conformance Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dimensional Tolerance</td>
            <td>Crate dimensions +/- 1.5mm standard</td>
            <td>Halt machine cycle; adjust mold clamp & cooling time</td>
          </tr>
          <tr>
            <td>Resin Scrap Ratio</td>
            <td>Maximum 2.0% allowable shift scrap</td>
            <td>Investigate sprue gate trimming and regrind balance</td>
          </tr>
          <tr>
            <td>Structural Rigidity</td>
            <td>Drop test from 1.5m without rib cracking</td>
            <td>Segregate batch; perform resin tensile melt flow test</td>
          </tr>
        </tbody>
      </table>

      <div class="callout callout-guardrail" style="margin-top: 10px; margin-bottom: 0;">
        <strong>Mandatory Compliance Invariant:</strong> ${s.compliance}
      </div>
    </div>
    `;
  }

  html += `
  </div>
  `;

  return html;
}
