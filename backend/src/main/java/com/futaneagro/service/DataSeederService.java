package com.futaneagro.service;

import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DataSeederService {

    @Autowired
    private UserRepository userRepo;
    @Autowired
    private PartyRepository partyRepo;
    @Autowired
    private VendorRepository vendorRepo;
    @Autowired
    private DriverRepository driverRepo;
    @Autowired
    private EmployeeRepository employeeRepo;
    @Autowired
    private EmployeeSalaryRepository salaryRepo;
    @Autowired
    private PpdRepository ppdRepo;
    @Autowired
    private PpmRepository ppmRepo;
    @Autowired
    private InventoryRepository inventoryRepo;
    @Autowired
    private RawMaterialRepository rawMaterialRepo;
    @Autowired
    private SalesRepository salesRepo;
    @Autowired
    private InvoiceRepository invoiceRepo;
    @Autowired
    private PaymentCollectionRepository paymentRepo;
    @Autowired
    private TransportRepository transportRepo;
    @Autowired
    private DispatchRepository dispatchRepo;
    @Autowired
    private MachineMasterRepository machineRepo;
    @Autowired
    private ExpenseRepository expenseRepo;
    @Autowired
    private BankTransactionRepository bankRepo;
    @Autowired
    private BranchRepository branchRepo;
    @Autowired
    private StockTransferRepository stockTransferRepo;
    @Autowired
    private AuditLogRepository auditRepo;
    @Autowired
    private TeamRepository teamRepo;
    @Autowired
    private RolePermissionRepository rolePermRepo;
    @Autowired
    private FeatureFlagRepository featureFlagRepo;
    @Autowired
    private SettingsRepository settingsRepo;
    @Autowired
    private CustomFieldDefinitionRepository customFieldDefRepo;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public Map<String, Object> seedAllComprehensiveData() {
        System.out.println("🌾 DataSeederService: Initiating enterprise dummy dataset population...");

        // 0. Seed Settings, Teams, Permissions, Features
        seedBrandingAndSettings();
        seedTeams();
        seedRolePermissions();
        seedFeatureFlags();
        seedCustomFieldDefinitions();
        seedAuditLogs();

        // 1. Seed Core Users
        seedUsers();

        // 2. Seed Parties
        List<Party> parties = seedParties();

        // 3. Seed Vendors
        List<Vendor> vendors = seedVendors();

        // 4. Seed Drivers
        List<Driver> drivers = seedDrivers();

        // 5. Seed Employees & Salaries
        seedEmployeesAndSalaries();

        // 6. Seed Inventory (Finished Goods & Buffer Stocks)
        seedInventory();

        // 7. Seed Production (PPD & PPM)
        seedProduction();

        // 8. Seed Raw Materials
        seedRawMaterials(vendors);

        // 9. Seed Sales & Invoices & Payments
        List<Sales> salesList = seedSalesAndInvoices(parties);

        // 10. Seed Transport & Dispatch Manifests
        seedTransportAndDispatch(drivers, salesList);

        // 11. Seed Machinery & Operating Expenses
        seedMachineryAndExpenses();

        // 12. Seed Bank Ledger Transactions
        seedBankTransactions();

        // 13. Seed Multi-Branch & Stock Transfers
        seedBranchesAndTransfers();

        AuditLog log = new AuditLog();
        log.setUsername("SUPER_ADMIN");
        log.setAction("Enterprise dummy dataset populated successfully across 18 database tables.");
        auditRepo.save(log);

        Map<String, Object> result = new HashMap<>();
        result.put("status", "SUCCESS");
        result.put("message", "Comprehensive Enterprise Agro dataset seeded successfully.");
        result.put("partiesCount", partyRepo.count());
        result.put("salesCount", salesRepo.count());
        result.put("invoicesCount", invoiceRepo.count());
        result.put("inventoryCount", inventoryRepo.count());
        result.put("productionCount", ppdRepo.count());
        result.put("transportsCount", transportRepo.count());
        result.put("dispatchesCount", dispatchRepo.count());
        result.put("expensesCount", expenseRepo.count());
        result.put("bankTransactionsCount", bankRepo.count());

        System.out.println("✨ DataSeederService: All 18 module tables seeded with rich production-grade data!");
        return result;
    }

    private void seedUsers() {
        if (userRepo.count() == 0) {
            userRepo.save(new User("SUPER_ADMIN", passwordEncoder.encode("superadmin123"), "SUPER_ADMIN", "Super Administrator"));
            userRepo.save(new User("ADMIN",       passwordEncoder.encode("admin123"),      "ADMIN",       "Operations Admin"));
            userRepo.save(new User("MANAGER",     passwordEncoder.encode("manager123"),    "MANAGER",     "Plant General Manager"));
            userRepo.save(new User("ACCOUNTANT",  passwordEncoder.encode("accountant123"), "ACCOUNTANT",  "Senior Financial Accountant"));
            userRepo.save(new User("OPERATOR",    passwordEncoder.encode("operator123"),   "OPERATOR",    "Shopfloor Operator"));
            userRepo.save(new User("VIEWER",      passwordEncoder.encode("viewer123"),     "VIEWER",      "Executive Read-Only Auditor"));
        }
    }

    private List<Party> seedParties() {
        if (partyRepo.count() < 5) {
            String[][] partyData = {
                {"Mahindra Agri Solutions Ltd.", "MIDC Bhosari, Pune, Maharashtra", "9822014589", "27AAACM1234F1ZV", "procurement@mahindraagri.com", "Pune", "Maharashtra", "500000"},
                {"Sahyadri Farms Post Harvest Care", "Mohadi, Nashik, Maharashtra", "9890123456", "27AAACS5678A1Z2", "sales@sahyadrifarms.com", "Nashik", "Maharashtra", "1000000"},
                {"Reliance Fresh Distribution Hub", "Kalyan-Bhiwandi Rd, Thane, Maharashtra", "9136098765", "27AABCR9999P1ZA", "fresh.procure@ril.com", "Thane", "Maharashtra", "750000"},
                {"BigBasket (Supermarket Grocery)", "Chakan Industrial Area, Pune", "9860112233", "27AAGCB4321Q1Z4", "vendor.desk@bigbasket.com", "Pune", "Maharashtra", "400000"},
                {"FreshToHome Agro Foods", "Yeshwanthpur, Bengaluru, Karnataka", "9900118822", "29AABCF1234M1Z5", "procure.south@freshtohome.com", "Bengaluru", "Karnataka", "600000"},
                {"Heritage Foods Retail Ltd.", "Panjagutta, Hyderabad, Telangana", "9848012345", "36AAACH8888K1Z7", "scm@heritagefoods.in", "Hyderabad", "Telangana", "450000"},
                {"Gujarat Agro Cold Chain Exporters", "Naroda GIDC, Ahmedabad, Gujarat", "9727054321", "24AABCG5555L1Z8", "export@gujagro.com", "Ahmedabad", "Gujarat", "850000"},
                {"Kalyan Agri Traders", "Market Yard, Gultekdi, Pune", "9422001122", "27AATPK1111N1Z3", "kalyan.traders@yahoo.com", "Pune", "Maharashtra", "300000"},
                {"Zomato Hyperpure Agro", "Wagholi Cold Center, Pune", "9819003344", "27AAACZ1122A1ZW", "hyperpure.agro@zomato.com", "Pune", "Maharashtra", "500000"},
                {"Adani Agri Fresh Logistics", "Taloja MIDC, Navi Mumbai", "9820099881", "27AAACA4455C1Z9", "agrifresh@adani.com", "Navi Mumbai", "Maharashtra", "1200000"}
            };

            for (int i = 0; i < partyData.length; i++) {
                Party p = new Party();
                p.setPartyName(partyData[i][0]);
                p.setPartyAddress(partyData[i][1]);
                p.setPartyContact(partyData[i][2]);
                p.setGstNumber(partyData[i][3]);
                p.setEmail(partyData[i][4]);
                p.setCity(partyData[i][5]);
                p.setState(partyData[i][6]);
                p.setIsActive(true);
                p.setCreatedDate(LocalDate.now().minusDays(30 - (i * 2)));
                partyRepo.save(p);
            }
        }
        return partyRepo.findAll();
    }

    private List<Vendor> seedVendors() {
        if (vendorRepo.count() < 4) {
            String[][] vendorData = {
                {"Supreme Polymers Packaging Ltd.", "Chakan MIDC Phase 2, Pune", "9822554411", "27AABCS1122D1Z1"},
                {"Sintex BAPL Industrial Containers", "Kalol, Gandhinagar, Gujarat", "9978901234", "24AAACS3344E1Z3"},
                {"Uflex Corrugated Packaging Systems", "Sanand Industrial Park, Ahmedabad", "9898012345", "24AAACU5566F1Z5"},
                {"Navkar Polymers Masterbatch & Granules", "Vapi GIDC, Gujarat", "9825112233", "24AABCN7788G1Z7"},
                {"Time Technoplast Agro Crates", "Silvassa, D&NH", "9904011223", "26AAACT9900H1Z9"},
                {"Nilkamal Material Handling Crates", "Sinnar, Nashik, Maharashtra", "9823098765", "27AAACN2233I1ZB"},
                {"Cryogas Nitrogen & Cold Storage Supplies", "Ranjangaon MIDC, Pune", "9860012345", "27AAACC4455J1ZD"},
                {"Balaji Agro Seeds & Fertilizers", "Baramati Agro Hub, Pune", "9423011223", "27AATPB6677K1ZF"}
            };

            for (String[] v : vendorData) {
                Vendor vendor = new Vendor();
                vendor.setVendorName(v[0]);
                vendor.setAddress(v[1]);
                vendor.setMobile(v[2]);
                vendor.setGstNumber(v[3]);
                vendorRepo.save(vendor);
            }
        }
        return vendorRepo.findAll();
    }

    private List<Driver> seedDrivers() {
        if (driverRepo.count() < 4) {
            String[][] driverData = {
                {"Baldev Singh Gill", "9922110033", "DL-1420230005421", "Hadapsar, Pune"},
                {"Rameshwar Shinde", "9850123456", "MH-1220190041234", "Baramati, Pune"},
                {"Sukhwinder Sandhu", "9888012345", "PB-1020210098765", "Nigdi, Pune"},
                {"Kashinath Pawar", "9766014455", "MH-1420180065432", "Talegaon, Pune"},
                {"Prakash Jadhav", "9822998877", "MH-1520200033221", "Nashik Road, Nashik"},
                {"Gurpreet Singh", "9914055667", "HR-0520220088990", "Vashi, Navi Mumbai"}
            };

            for (String[] d : driverData) {
                Driver driver = new Driver();
                driver.setDriverName(d[0]);
                driver.setMobile(d[1]);
                driver.setLicenseNumber(d[2]);
                driver.setAddress(d[3]);
                driverRepo.save(driver);
            }
        }
        return driverRepo.findAll();
    }

    private void seedEmployeesAndSalaries() {
        if (employeeRepo.count() < 6) {
            Object[][] empData = {
                {"Sachin Deshmukh", "9823011223", BigDecimal.valueOf(45000), "Kothrud, Pune", "Production Manager", LocalDate.of(2023, 4, 1), "458912345678", "HDFC0001234"},
                {"Mahesh Gaikwad", "9850022334", BigDecimal.valueOf(28000), "Hadapsar, Pune", "Machine Operator - Line 1", LocalDate.of(2023, 8, 15), "567890123456", "ICIC0005678"},
                {"Sunil More", "9766033445", BigDecimal.valueOf(26000), "Chakan, Pune", "Machine Operator - Line 2", LocalDate.of(2024, 1, 10), "678901234567", "SBIN0006789"},
                {"Priyanka Kulkarni", "9890044556", BigDecimal.valueOf(38000), "Wakad, Pune", "Senior Accountant", LocalDate.of(2023, 6, 1), "789012345678", "UTIB0007890"},
                {"Aniket Shinde", "9922055667", BigDecimal.valueOf(32000), "Bhosari, Pune", "Quality Assurance Lead", LocalDate.of(2023, 11, 20), "890123456789", "KKBK0008901"},
                {"Tanaji Bhosale", "9422066778", BigDecimal.valueOf(24000), "Talegaon, Pune", "Dispatch & Logistics Supervisor", LocalDate.of(2024, 3, 5), "901234567890", "BARB0009012"},
                {"Dipak Wagh", "9821077889", BigDecimal.valueOf(22000), "Chinchwad, Pune", "Inventory Storekeeper", LocalDate.of(2024, 5, 1), "234567890123", "PUNB0002345"},
                {"Snehal Joshi", "9860088990", BigDecimal.valueOf(35000), "Aundh, Pune", "HR & Admin Officer", LocalDate.of(2023, 9, 12), "345678901234", "MAHB0003456"}
            };

            for (Object[] e : empData) {
                Employee emp = new Employee();
                emp.setEmpName((String) e[0]);
                emp.setEmpContact((String) e[1]);
                emp.setSalary((BigDecimal) e[2]);
                emp.setAddress((String) e[3]);
                emp.setDesignation((String) e[4]);
                emp.setJoiningDate((LocalDate) e[5]);
                emp.setAadhaarNo((String) e[6]);
                emp.setBankAccount((String) e[7]);
                emp.setPhotoPath("assets/avatars/default.png");
                emp.setAadhaarCardPath("uploads/aadhaar_" + ((String) e[6]).substring(0, 4) + ".pdf");
                emp.setBankPassbookPath("uploads/passbook_" + ((String) e[7]) + ".pdf");
                Employee savedEmp = employeeRepo.save(emp);

                // Seed monthly salary record for current & previous month
                EmployeeSalary sal1 = new EmployeeSalary();
                sal1.setEmployee(savedEmp);
                sal1.setMonth("JULY");
                sal1.setYear(2026);
                sal1.setSalaryAmount(savedEmp.getSalary());
                sal1.setStatus("Paid");
                sal1.setPaidDate(LocalDate.of(2026, 8, 5));
                salaryRepo.save(sal1);

                EmployeeSalary sal2 = new EmployeeSalary();
                sal2.setEmployee(savedEmp);
                sal2.setMonth("AUGUST");
                sal2.setYear(2026);
                sal2.setSalaryAmount(savedEmp.getSalary());
                sal2.setStatus("Pending");
                salaryRepo.save(sal2);
            }
        }
    }

    private void seedInventory() {
        if (inventoryRepo.count() < 4) {
            Object[][] items = {
                {"Export Grade A Grapes Crate", "Food-Grade Plastic", 8500, 14200, 11500},
                {"Pomegranate Super-Red Crate (5kg)", "Ventilated Plastic", 6200, 9800, 7400},
                {"Kesar Mango Export Box (10kg)", "Corrugated Solid Board", 4500, 7200, 5800},
                {"Fresh Tomato Commercial Tray", "Heavy-Duty HDPE", 9000, 18500, 15200},
                {"Citrus / Orange Storage Crate", "Plastic Perforated", 3500, 6000, 4100},
                {"Capsicum & Exotic Veg Box", "Biodegradable Board", 2800, 4900, 3600}
            };

            for (Object[] item : items) {
                Inventory inv = new Inventory();
                inv.setCrateType((String) item[0]);
                inv.setMaterialType((String) item[1]);
                inv.setOpeningStock((Integer) item[2]);
                inv.setProducedStock((Integer) item[3]);
                inv.setSoldStock((Integer) item[4]);
                inventoryRepo.save(inv);
            }
        }
    }

    private void seedProduction() {
        if (ppdRepo.count() < 10) {
            String[] crateTypes = {
                "Export Grade A Grapes Crate",
                "Pomegranate Super-Red Crate (5kg)",
                "Kesar Mango Export Box (10kg)",
                "Fresh Tomato Commercial Tray"
            };

            for (int day = 15; day >= 1; day--) {
                for (String cType : crateTypes) {
                    Ppd ppd = new Ppd();
                    ppd.setDate(LocalDate.now().minusDays(day));
                    ppd.setCrateType(cType);
                    int total = 1200 + (day * 35) + (int)(Math.random() * 200);
                    int rejected = (int)(total * 0.015); // ~1.5% rejection rate
                    ppd.setTotalProduction(total);
                    ppd.setSuccessful(total - rejected);
                    ppd.setRejected(rejected);
                    ppdRepo.save(ppd);
                }
            }
        }

        if (ppmRepo.count() < 5) {
            String[] months = {"MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST"};
            int[] produced = {125000, 142000, 168000, 155000, 182000, 195000};
            int[] units = {24000, 27500, 32000, 29800, 35000, 37200};

            for (int i = 0; i < months.length; i++) {
                Ppm ppm = new Ppm();
                ppm.setMonth(months[i]);
                ppm.setYear(2026);
                ppm.setCratesProduced(produced[i]);
                ppm.setElectricityUnits(BigDecimal.valueOf(units[i]));
                ppm.setElectricityBill(BigDecimal.valueOf(units[i] * 8.25)); // 8.25 INR/unit
                ppmRepo.save(ppm);
            }
        }
    }

    private void seedRawMaterials(List<Vendor> vendors) {
        if (rawMaterialRepo.count() < 5 && !vendors.isEmpty()) {
            Object[][] rmData = {
                {"Virgin HDPE Granules Grade 100", BigDecimal.valueOf(5000), BigDecimal.valueOf(92.50)},
                {"Food-Grade PP Granules (Impact Copolymer)", BigDecimal.valueOf(4200), BigDecimal.valueOf(88.00)},
                {"Recycled Polyethylene Compound", BigDecimal.valueOf(6500), BigDecimal.valueOf(64.00)},
                {"UV Stabilizer Masterbatch (Agro Grade)", BigDecimal.valueOf(800), BigDecimal.valueOf(240.00)},
                {"Blue/Red Colour Masterbatch Pigment", BigDecimal.valueOf(600), BigDecimal.valueOf(185.00)},
                {"Corrugated 5-Ply Outer Carton Sheets", BigDecimal.valueOf(3500), BigDecimal.valueOf(45.00)}
            };

            for (int i = 0; i < rmData.length; i++) {
                RawMaterial rm = new RawMaterial();
                rm.setDate(LocalDate.now().minusDays(18 - (i * 2)));
                rm.setMaterialName((String) rmData[i][0]);
                rm.setWeight((BigDecimal) rmData[i][1]);
                rm.setRate((BigDecimal) rmData[i][2]);
                rm.setVendor(vendors.get(i % vendors.size()));
                rawMaterialRepo.save(rm);
            }
        }
    }

    private List<Sales> seedSalesAndInvoices(List<Party> parties) {
        List<Sales> savedSales = new ArrayList<>();
        if (salesRepo.count() < 10 && !parties.isEmpty()) {
            String[] crateTypes = {
                "Export Grade A Grapes Crate",
                "Pomegranate Super-Red Crate (5kg)",
                "Kesar Mango Export Box (10kg)",
                "Fresh Tomato Commercial Tray"
            };

            int invNum = 101;
            for (int i = 0; i < 16; i++) {
                Party p = parties.get(i % parties.size());
                String cType = crateTypes[i % crateTypes.length];
                int qty = 150 + (i * 30);
                BigDecimal rate = BigDecimal.valueOf(140 + ((i % 4) * 25));
                BigDecimal totalAmount = rate.multiply(BigDecimal.valueOf(qty));
                BigDecimal paidAmount = (i % 3 == 0) ? totalAmount : totalAmount.multiply(BigDecimal.valueOf(0.70));

                Sales sale = new Sales();
                sale.setDate(LocalDate.now().minusDays(20 - i));
                sale.setParty(p);
                sale.setCrateType(cType);
                sale.setCrateMaterial("Plastic");
                sale.setQuantity(qty);
                sale.setRate(rate);
                sale.setPaid(paidAmount);
                Sales saved = salesRepo.save(sale);
                savedSales.add(saved);

                // Create linked Tax Invoice
                Invoice inv = new Invoice();
                inv.setInvoiceNo("INV-2026-" + (invNum++));
                inv.setSale(saved);
                inv.setCreatedDate(sale.getDate());
                invoiceRepo.save(inv);

                // Create linked Payment Collection
                if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
                    PaymentCollection pc = new PaymentCollection();
                    pc.setParty(p);
                    pc.setInvoiceNo(inv.getInvoiceNo());
                    pc.setAmountReceived(paidAmount);
                    pc.setPaymentMode((i % 2 == 0) ? "UPI" : "NEFT/RTGS");
                    pc.setPaymentDate(sale.getDate().plusDays(1));
                    paymentRepo.save(pc);
                }
            }
        }
        return salesRepo.findAll();
    }

    private void seedTransportAndDispatch(List<Driver> drivers, List<Sales> salesList) {
        if (transportRepo.count() < 5 && !drivers.isEmpty()) {
            String[] trucks = {"MH-12-RN-4589", "MH-12-FC-7890", "MH-14-BT-1122", "MH-15-AG-9900", "MH-04-KD-3344"};
            for (int i = 0; i < 8; i++) {
                Transport t = new Transport();
                t.setDate(LocalDate.now().minusDays(15 - i));
                t.setTruckNumber(trucks[i % trucks.length]);
                t.setDriver(drivers.get(i % drivers.size()));
                t.setRent(BigDecimal.valueOf(8500 + (i * 500)));
                t.setAdvance(BigDecimal.valueOf(3000 + (i * 200)));
                transportRepo.save(t);
            }
        }

        if (dispatchRepo.count() < 5 && !salesList.isEmpty() && !drivers.isEmpty()) {
            String[] trucks = {"MH-12-RN-4589", "MH-12-FC-7890", "MH-14-BT-1122", "MH-15-AG-9900"};
            String[] statuses = {"Delivered", "In Transit", "Delivered", "Pending"};

            for (int i = 0; i < Math.min(salesList.size(), 10); i++) {
                Dispatch d = new Dispatch();
                d.setDispatchId(1001 + i);
                d.setDispatchNumber("DSP-2026-" + (1001 + i));
                d.setSale(salesList.get(i));
                d.setVehicleNumber(trucks[i % trucks.length]);
                d.setDriverName(drivers.get(i % drivers.size()).getDriverName());
                d.setDate(LocalDate.now().minusDays(12 - i));
                d.setStatus(statuses[i % statuses.length]);
                dispatchRepo.save(d);
            }
        }
    }

    private void seedMachineryAndExpenses() {
        if (machineRepo.count() < 4) {
            String[][] machines = {
                {"High-Speed Injection Moulding Press 1 (450T)", "Windsor Machines India", "Running", "2022-03-15", "2027-03-15"},
                {"Heavy-Duty Agro Crate Moulding Press 2 (650T)", "Toshiba Machine India", "Running", "2023-01-20", "2028-01-20"},
                {"Automated Optical Fruit Sorting & Grading Line", "Compac Sorting Equipment", "Running", "2023-06-10", "2026-06-10"},
                {"Cold Chamber Ammonia Chilling Compressor #1", "Kirloskar Chillers", "Running", "2021-11-05", "2026-11-05"},
                {"Automatic Box Strapping & Stretch Wrapping Unit", "Signode Packaging", "Running", "2024-02-18", "2027-02-18"},
                {"Diesel Backup Generator (250 kVA)", "Cummins Power Systems", "Running", "2022-08-01", "2027-08-01"}
            };

            for (String[] m : machines) {
                MachineMaster mm = new MachineMaster();
                mm.setMachineName(m[0]);
                mm.setManufacturer(m[1]);
                mm.setStatus(m[2]);
                mm.setPurchaseDate(LocalDate.parse(m[3]));
                mm.setWarrantyDate(LocalDate.parse(m[4]));
                machineRepo.save(mm);
            }
        }

        if (expenseRepo.count() < 6) {
            Object[][] expData = {
                {LocalDate.now().minusDays(12), "Maintenance", "Hydraulic oil replacement & filter change for 650T press", BigDecimal.valueOf(18500)},
                {LocalDate.now().minusDays(10), "Electricity", "MSEDCL Industrial HT Power Bill for Factory Unit 1", BigDecimal.valueOf(142000)},
                {LocalDate.now().minusDays(8), "Fuel", "High-speed diesel for 250 kVA backup generator during load shedding", BigDecimal.valueOf(24500)},
                {LocalDate.now().minusDays(6), "Transport", "Local intra-plant forklift battery service & tyre replacement", BigDecimal.valueOf(8200)},
                {LocalDate.now().minusDays(4), "Miscellaneous", "Nitrogen cylinder refills and vacuum chamber sensor calibration", BigDecimal.valueOf(12800)},
                {LocalDate.now().minusDays(2), "Office", "Factory floor safety gear (Helmets, gloves, safety boots for 25 workers)", BigDecimal.valueOf(9500)}
            };

            for (Object[] exp : expData) {
                Expense e = new Expense();
                e.setDate((LocalDate) exp[0]);
                e.setCategory((String) exp[1]);
                e.setDescription((String) exp[2]);
                e.setAmount((BigDecimal) exp[3]);
                expenseRepo.save(e);
            }
        }
    }

    private void seedBankTransactions() {
        if (bankRepo.count() < 6) {
            Object[][] btData = {
                {LocalDate.now().minusDays(14), "Bank", BigDecimal.valueOf(325000), "Payment received from Mahindra Agri Solutions Ltd (RTGS)", "Credit"},
                {LocalDate.now().minusDays(12), "UPI", BigDecimal.valueOf(48500), "Payment received from Kalyan Agri Traders (UPI Bharat QR)", "Credit"},
                {LocalDate.now().minusDays(10), "Bank", BigDecimal.valueOf(185000), "Payment received from Reliance Fresh Distribution (NEFT)", "Credit"},
                {LocalDate.now().minusDays(9), "Bank", BigDecimal.valueOf(92500), "Vendor payout to Supreme Polymers Packaging Ltd for HDPE raw material", "Debit"},
                {LocalDate.now().minusDays(7), "Bank", BigDecimal.valueOf(142000), "MSEDCL Industrial Electricity Bill payment via Netbanking", "Debit"},
                {LocalDate.now().minusDays(5), "UPI", BigDecimal.valueOf(125000), "Payment received from Sahyadri Farms Post Harvest Care (UPI QR)", "Credit"},
                {LocalDate.now().minusDays(3), "Bank", BigDecimal.valueOf(74000), "Vendor payout to Uflex Corrugated Packaging Systems", "Debit"},
                {LocalDate.now().minusDays(1), "Bank", BigDecimal.valueOf(250000), "Payment received from Adani Agri Fresh Logistics (NEFT)", "Credit"}
            };

            for (Object[] b : btData) {
                BankTransaction bt = new BankTransaction();
                bt.setDate((LocalDate) b[0]);
                bt.setMode((String) b[1]);
                bt.setAmount((BigDecimal) b[2]);
                bt.setDescription((String) b[3]);
                bt.setType((String) b[4]);
                bankRepo.save(bt);
            }
        }
    }

    private void seedBranchesAndTransfers() {
        if (branchRepo.count() < 2) {
            Branch b1 = new Branch();
            b1.setBranchName("Pune Central Processing Plant & HQ");
            b1.setBranchCode("PUN-HQ-01");
            b1.setLocation("Chakan Industrial Phase 2, Pune");
            b1.setIsMainPlant(true);
            Branch mainBranch = branchRepo.save(b1);

            Branch b2 = new Branch();
            b2.setBranchName("Baramati Cold Storage & Packaging Hub");
            b2.setBranchCode("BRM-COLD-02");
            b2.setLocation("Baramati Agro MIDC, Pune");
            b2.setIsMainPlant(false);
            Branch coldBranch = branchRepo.save(b2);

            Branch b3 = new Branch();
            b3.setBranchName("Nashik Export Logistics Center");
            b3.setBranchCode("NSK-EXP-03");
            b3.setLocation("Mohadi Agro Park, Nashik");
            b3.setIsMainPlant(false);
            Branch nskBranch = branchRepo.save(b3);

            // Seed Stock Transfers between branches
            StockTransfer st1 = new StockTransfer();
            st1.setTransferDate(LocalDate.now().minusDays(4));
            st1.setSourceBranch(mainBranch);
            st1.setDestinationBranch(coldBranch);
            st1.setCrateType("Export Grade A Grapes Crate");
            st1.setQuantity(1500);
            st1.setStatus("RECEIVED");
            stockTransferRepo.save(st1);

            StockTransfer st2 = new StockTransfer();
            st2.setTransferDate(LocalDate.now().minusDays(1));
            st2.setSourceBranch(mainBranch);
            st2.setDestinationBranch(nskBranch);
            st2.setCrateType("Pomegranate Super-Red Crate (5kg)");
            st2.setQuantity(850);
            st2.setStatus("IN_TRANSIT");
            stockTransferRepo.save(st2);
        }
    }

    private void seedBrandingAndSettings() {
        if (settingsRepo.count() == 0) {
            settingsRepo.save(new Settings("app_display_name", "Futane Agro ERP"));
            settingsRepo.save(new Settings("app_tagline", "Quality Crates, Stronger Future"));
            settingsRepo.save(new Settings("brand_primary_color", "#d97706"));
            settingsRepo.save(new Settings("brand_primary_hover", "#b45309"));
            settingsRepo.save(new Settings("brand_logo_url", "assets/logo.svg"));
            settingsRepo.save(new Settings("default_theme", "light"));
            settingsRepo.save(new Settings("enabled_languages", "en,mr,hi"));
            settingsRepo.save(new Settings("notif_new_invoice", "true"));
            settingsRepo.save(new Settings("notif_payment_received", "true"));
            settingsRepo.save(new Settings("notif_low_stock", "true"));
            settingsRepo.save(new Settings("notif_machine_breakdown", "true"));
            settingsRepo.save(new Settings("notif_daily_summary", "true"));
        }
    }

    private void seedTeams() {
        if (teamRepo.count() == 0) {
            teamRepo.save(new Team("Manufacturing", "MANUFACTURING", "Production floor, injection moulding & machinery maintenance", "precision_manufacturing", "#d97706", 1));
            teamRepo.save(new Team("Commerce", "COMMERCE", "Party accounts, wholesale orders, billing & invoices", "storefront", "#2563eb", 2));
            teamRepo.save(new Team("Supply Chain", "SUPPLY_CHAIN", "Inventory management, raw materials, vendor logistics & dispatch", "local_shipping", "#059669", 3));
            teamRepo.save(new Team("Finance", "FINANCE", "Financial ledgers, bank transactions, expenses & analytics", "account_balance", "#7c3aed", 4));
            teamRepo.save(new Team("Human Resources", "HR", "Employee directory, workforce attendance & payroll disbursements", "badge", "#db2777", 5));
            teamRepo.save(new Team("Administration", "ADMIN", "System configuration, user security, role matrix & audit trails", "admin_panel_settings", "#4b5563", 6));
        }
    }

    private void seedRolePermissions() {
        if (rolePermRepo.count() == 0) {
            String[] modules = {
                "dashboard", "production", "monthly-production", "machines",
                "parties", "sales", "payments", "invoices", "billinghub",
                "inventory", "raw-materials", "vendors", "dispatch", "transports", "drivers",
                "bank", "expenses", "reports", "analytics",
                "employees", "salaries",
                "settings", "audit-logs"
            };

            for (String mod : modules) {
                String modName = formatModuleName(mod);
                // 1. SUPER_ADMIN: Full Access Everywhere
                rolePermRepo.save(new RolePermission("SUPER_ADMIN", mod, modName, true, true, true, true, true));

                // 2. ADMIN: All except Settings
                boolean adminView = !mod.equals("settings");
                rolePermRepo.save(new RolePermission("ADMIN", mod, modName, adminView, adminView, adminView, adminView, adminView));

                // 3. MANAGER: All except Settings & Audit Logs
                boolean mgrView = !mod.equals("settings") && !mod.equals("audit-logs");
                rolePermRepo.save(new RolePermission("MANAGER", mod, modName, mgrView, mgrView, mgrView, false, true));

                // 4. ACCOUNTANT: Finance & Commercial
                boolean accView = Arrays.asList("dashboard", "payments", "invoices", "billinghub", "expenses", "bank", "salaries", "reports", "analytics").contains(mod);
                rolePermRepo.save(new RolePermission("ACCOUNTANT", mod, modName, accView, accView, accView, false, accView));

                // 5. OPERATOR: Production & Inventory
                boolean opView = Arrays.asList("dashboard", "production", "monthly-production", "machines", "inventory", "raw-materials").contains(mod);
                rolePermRepo.save(new RolePermission("OPERATOR", mod, modName, opView, opView, opView, false, false));

                // 6. VIEWER: Read-Only across standard modules
                boolean viewerView = !mod.equals("settings") && !mod.equals("audit-logs");
                rolePermRepo.save(new RolePermission("VIEWER", mod, modName, viewerView, false, false, false, viewerView));
            }
        }
    }

    private void seedFeatureFlags() {
        if (featureFlagRepo.count() == 0) {
            String[][] flags = {
                {"dashboard", "Executive Dashboard", "Core", "dashboard", "Consolidated executive telemetry & KPIs"},
                {"production", "Daily Production Entry", "Manufacturing", "precision_manufacturing", "Live shift log and crate output logging"},
                {"monthly-production", "Monthly Production Summary", "Manufacturing", "calendar_month", "Aggregated monthly manufacturing overview"},
                {"machines", "Factory Machines Inventory", "Manufacturing", "settings_suggest", "Injection moulding equipment maintenance"},
                {"parties", "Parties & Customers Directory", "Commerce", "group", "Customer directory, GST records & credit tracking"},
                {"sales", "Sales Orders & Transactions", "Commerce", "shopping_cart", "Wholesale crate sales bookings and delivery tracking"},
                {"payments", "Payment Registry & Collections", "Commerce", "payments", "Customer receipt ledger and outstanding dues"},
                {"invoices", "Invoices & Ledger", "Commerce", "receipt_long", "GST compliant tax invoice generation and billing records"},
                {"billinghub", "Billing Hub & Print Center", "Commerce", "description", "Exportable GST tax invoices, challans & salary slips"},
                {"inventory", "Finished Goods Inventory", "Supply Chain", "inventory_2", "Crate stock levels and real-time buffer balances"},
                {"raw-materials", "Raw Material Stock Ledger", "Supply Chain", "category", "Polypropylene granules, masterbatch & pigments"},
                {"vendors", "Vendors & Suppliers Directory", "Supply Chain", "store", "Supplier contact registry and procurement logs"},
                {"dispatch", "Dispatch Logistics Manifest", "Supply Chain", "local_shipping", "Gate pass creation and delivery tracking"},
                {"transports", "Transport Fleet & Rentals", "Supply Chain", "commute", "Rental vehicle allocation and freight logging"},
                {"drivers", "Drivers Directory", "Supply Chain", "badge", "Driver licensing, mobile contacts & trip history"},
                {"bank", "Bank Ledger Transactions", "Finance", "account_balance", "Company bank accounts, UPI & NEFT reconciliation"},
                {"expenses", "Operating Expense Ledger", "Finance", "receipt", "Utilities, power, fuel, diesel & factory maintenance"},
                {"reports", "Financial & Operational Reports", "Finance", "assessment", "P&L summaries, balance sheets & audit exports"},
                {"analytics", "Advanced Analytics & Forecasting", "Finance", "analytics", "Predictive demand curves and margin analytics"},
                {"employees", "Employee Directory", "Human Resources", "people", "Worker profiles, designations & bank details"},
                {"salaries", "Salary & Payroll Management", "Human Resources", "account_balance_wallet", "Monthly salary slips, advances & PF deductions"},
                {"settings", "System Settings & Admin", "Administration", "settings", "Full Super Admin no-code control center"},
                {"audit-logs", "Enterprise Security Audit Trail", "Administration", "history", "System change tracking and security log records"}
            };

            for (String[] f : flags) {
                featureFlagRepo.save(new FeatureFlag(f[0], f[1], f[2], true, f[4], f[3]));
            }
        }
    }

    private void seedCustomFieldDefinitions() {
        if (customFieldDefRepo.count() == 0) {
            customFieldDefRepo.save(new CustomFieldDefinition("PARTIES", "credit_days", "Credit Days Allowed", "NUMBER", null, false));
            customFieldDefRepo.save(new CustomFieldDefinition("PARTIES", "tax_category", "Tax Category", "SELECT", "Regular,Composition,SEZ,Exempted", false));
            customFieldDefRepo.save(new CustomFieldDefinition("VENDORS", "msme_number", "MSME Registration Udyam No", "TEXT", null, false));
            customFieldDefRepo.save(new CustomFieldDefinition("EMPLOYEES", "blood_group", "Blood Group", "SELECT", "A+,A-,B+,B-,O+,O-,AB+,AB-", false));
            customFieldDefRepo.save(new CustomFieldDefinition("MACHINES", "next_service_due", "Next Scheduled Service Date", "DATE", null, false));
        }
    }

    private void seedAuditLogs() {
        if (auditRepo.count() == 0) {
            LocalDateTime now = LocalDateTime.now();

            AuditLog l1 = new AuditLog();
            l1.setAuditId(1001);
            l1.setUsername("admin");
            l1.setAction("USER_LOGIN_SUCCESS");
            l1.setTableName("auth_session");
            l1.setNewValue("Super Admin (User ID: #101) logged in via Web Portal. Role: ROLE_SUPER_ADMIN");
            l1.setIpAddress("127.0.0.1");
            l1.setTimestamp(now.minusHours(4));
            l1.setCreatedAt(now.minusHours(4));
            auditRepo.save(l1);

            AuditLog l2 = new AuditLog();
            l2.setAuditId(1002);
            l2.setUsername("admin");
            l2.setAction("BRANDING_THEME_UPDATED");
            l2.setTableName("t_core_branding");
            l2.setNewValue("Updated primary brand color to #d97706 (Amber Gold) and company title");
            l2.setIpAddress("127.0.0.1");
            l2.setTimestamp(now.minusHours(3));
            l2.setCreatedAt(now.minusHours(3));
            auditRepo.save(l2);

            AuditLog l3 = new AuditLog();
            l3.setAuditId(1003);
            l3.setUsername("manager");
            l3.setAction("PRODUCTION_BATCH_CREATED");
            l3.setTableName("production");
            l3.setNewValue("Recorded new manufacturing shift batch for Injection Moulding Machine #01 (1,200 crates)");
            l3.setIpAddress("192.168.1.104");
            l3.setTimestamp(now.minusHours(2));
            l3.setCreatedAt(now.minusHours(2));
            auditRepo.save(l3);

            AuditLog l4 = new AuditLog();
            l4.setAuditId(1004);
            l4.setUsername("accountant");
            l4.setAction("TAX_INVOICE_GENERATED");
            l4.setTableName("invoices");
            l4.setNewValue("Generated GST Tax Invoice #INV-2026-089 for Adani Agri Fresh Ltd. (₹1,45,000)");
            l4.setIpAddress("192.168.1.108");
            l4.setTimestamp(now.minusMinutes(45));
            l4.setCreatedAt(now.minusMinutes(45));
            auditRepo.save(l4);

            AuditLog l5 = new AuditLog();
            l5.setAuditId(1005);
            l5.setUsername("admin");
            l5.setAction("ROLE_PERMISSIONS_SYNCED");
            l5.setTableName("t_core_role_permissions");
            l5.setNewValue("Updated access control matrix for role: OPERATOR. Real-time WebSocket event broadcasted.");
            l5.setIpAddress("127.0.0.1");
            l5.setTimestamp(now.minusMinutes(12));
            l5.setCreatedAt(now.minusMinutes(12));
            auditRepo.save(l5);
        }
    }

    private String formatModuleName(String key) {
        if (key == null) return "";
        return Arrays.stream(key.split("-"))
            .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1))
            .collect(Collectors.joining(" "));
    }
}
