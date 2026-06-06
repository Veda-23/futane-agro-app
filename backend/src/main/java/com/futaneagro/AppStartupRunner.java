package com.futaneagro;

import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.core.env.Environment;

import java.io.File;
import java.io.FileOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class AppStartupRunner implements CommandLineRunner {

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
    private PpdRepository ppdRepo;

    @Autowired
    private PpmRepository ppmRepo;

    @Autowired
    private SalesRepository salesRepo;

    @Autowired
    private PaymentCollectionRepository paymentRepo;

    @Autowired
    private InventoryRepository inventoryRepo;

    @Autowired
    private RawMaterialRepository rawMaterialRepo;

    @Autowired
    private TransportRepository transportRepo;

    @Autowired
    private EmployeeSalaryRepository salaryRepo;

    @Autowired
    private InvoiceRepository invoiceRepo;

    @Autowired
    private AuditLogRepository auditRepo;

    @Autowired
    private MachineMasterRepository machineMasterRepo;

    @Autowired
    private ExpenseRepository expenseRepo;

    @Autowired
    private BankTransactionRepository bankTransactionRepo;

    @Autowired
    private Environment env;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🚀 AppStartupRunner: Initializing Futane Agro bootstrap processes for 18 tables...");

        // 1. Generate sample Excel file if it doesn't exist
        String excelFilePath = "C:\\Users\\Vedant\\.gemini\\antigravity-ide\\scratch\\futane-agro-app\\futane_agro_data.xlsx";
        File excelFile = new File(excelFilePath);
        if (!excelFile.exists()) {
            System.out.println("Generating sample Excel spreadsheet at: " + excelFilePath);
            generateSampleExcel(excelFile);
        }

        // 2. Conditional Users Seeding based on Profile
        String[] activeProfiles = env.getActiveProfiles();
        boolean isProd = false;
        boolean isUat = false;
        for (String profile : activeProfiles) {
            if ("prod".equalsIgnoreCase(profile)) {
                isProd = true;
            } else if ("uat".equalsIgnoreCase(profile)) {
                isUat = true;
            }
        }

        if (userRepo.count() == 0) {
            if (isUat) {
                userRepo.save(new User("SUPER_ADMIN",  passwordEncoder.encode("superadmin123"), "SUPER_ADMIN", "Super Admin"));
                userRepo.save(new User("UAT_ADMIN",    passwordEncoder.encode("admin123"),    "ADMIN",    "UAT Admin User"));
                userRepo.save(new User("ADMIN",        passwordEncoder.encode("admin123"),    "ADMIN",    "Admin User"));
                userRepo.save(new User("ACCOUNTANT",   passwordEncoder.encode("accountant123"), "ACCOUNTANT", "Accountant User"));
                userRepo.save(new User("UAT_OPERATOR", passwordEncoder.encode("operator123"), "OPERATOR", "UAT Operator User"));
                userRepo.save(new User("OPERATOR",     passwordEncoder.encode("operator123"), "OPERATOR", "Operator User"));
                userRepo.save(new User("VIEWER",       passwordEncoder.encode("viewer123"),     "VIEWER",      "Viewer User"));
                System.out.println("✓ UAT Users seeded with BCrypt-encoded passwords.");
            } else if (isProd) {
                userRepo.save(new User("SUPER_ADMIN",  passwordEncoder.encode("superadmin123"), "SUPER_ADMIN", "Super Admin"));
                userRepo.save(new User("ADMIN",        passwordEncoder.encode("admin123"),      "ADMIN",       "Admin User"));
                userRepo.save(new User("MANAGER",      passwordEncoder.encode("manager123"),    "MANAGER",     "Manager User"));
                userRepo.save(new User("ACCOUNTANT",   passwordEncoder.encode("accountant123"), "ACCOUNTANT",  "Accountant User"));
                userRepo.save(new User("OPERATOR",     passwordEncoder.encode("operator123"),   "OPERATOR",    "Operator User"));
                userRepo.save(new User("VIEWER",       passwordEncoder.encode("viewer123"),     "VIEWER",      "Viewer User"));
                System.out.println("✓ Production Users seeded with BCrypt-encoded passwords.");
            } else {
                userRepo.save(new User("admin",        passwordEncoder.encode("admin123"),       "ADMIN",       "Vedant Futane"));
                userRepo.save(new User("manager",      passwordEncoder.encode("manager123"),     "MANAGER",     "Sanjay Manager"));
                userRepo.save(new User("accountant",   passwordEncoder.encode("accountant123"),  "ACCOUNTANT",  "Pankaj Accountant"));
                userRepo.save(new User("operator",     passwordEncoder.encode("operator123"),    "OPERATOR",    "Anil Operator"));
                System.out.println("✓ Default dev users seeded with BCrypt-encoded passwords.");
            }
        }

        // 3. Party
        if (partyRepo.count() == 0) {
            Party party1 = new Party();
            party1.setPartyName("Ramesh Kumar");
            party1.setPartyAddress("Pune, Maharashtra");
            party1.setPartyContact("9876543210");
            party1.setGstNumber("27AAAAA1111A1Z1");
            party1.setEmail("ramesh@agro.com");
            party1.setCity("Pune");
            party1.setState("Maharashtra");
            party1.setIsActive(true);
            party1.setCreatedDate(LocalDate.now().minusDays(10));
            partyRepo.save(party1);

            Party party2 = new Party();
            party2.setPartyName("Patel Traders");
            party2.setPartyAddress("Ahmedabad, Gujarat");
            party2.setPartyContact("9999999999");
            party2.setGstNumber("24BBBBB2222B2Z2");
            party2.setEmail("patel@traders.com");
            party2.setCity("Ahmedabad");
            party2.setState("Gujarat");
            party2.setIsActive(true);
            party2.setCreatedDate(LocalDate.now().minusDays(5));
            partyRepo.save(party2);
            System.out.println("✓ Parties seeded.");
        }

        // 4. Vendor
        if (vendorRepo.count() == 0) {
            Vendor vendor = new Vendor();
            vendor.setVendorName("Reliance Polymers");
            vendor.setMobile("9890123456");
            vendor.setAddress("Mumbai, Maharashtra");
            vendor.setGstNumber("27VND1234A1Z9");
            vendorRepo.save(vendor);
            System.out.println("✓ Vendors seeded.");
        }

        // 5. Driver
        if (driverRepo.count() == 0) {
            Driver driver = new Driver();
            driver.setDriverName("Baldev Singh");
            driver.setMobile("9922110033");
            driver.setLicenseNumber("DL-1420230005421");
            driver.setAddress("Hadapsar, Pune");
            driverRepo.save(driver);
            System.out.println("✓ Drivers seeded.");
        }

        // 6. Employees
        if (employeeRepo.count() == 0) {
            Employee emp = new Employee();
            emp.setEmpName("Amit Patel");
            emp.setEmpContact("9823456789");
            emp.setSalary(BigDecimal.valueOf(25000));
            emp.setAddress("Pune, Maharashtra");
            emp.setDesignation("Operator");
            emp.setJoiningDate(LocalDate.of(2025, 1, 15));
            emp.setAadhaarNo("123456789012");
            emp.setBankAccount("HDFC00012345678");
            employeeRepo.save(emp);
            System.out.println("✓ Employees seeded.");
        }

        // 7. Inventory (Initial Opening stock)
        if (inventoryRepo.count() == 0) {
            Inventory inv1 = new Inventory();
            inv1.setCrateType("Apple Crate");
            inv1.setMaterialType("Plastic");
            inv1.setOpeningStock(5000);
            inv1.setProducedStock(0);
            inv1.setSoldStock(0);
            inventoryRepo.save(inv1);

            Inventory inv2 = new Inventory();
            inv2.setCrateType("Tomato Tray");
            inv2.setMaterialType("Plastic");
            inv2.setOpeningStock(2500);
            inv2.setProducedStock(0);
            inv2.setSoldStock(0);
            inventoryRepo.save(inv2);
            System.out.println("✓ Inventory seeded.");
        }

        // 8. Ppd (Production per Day)
        if (ppdRepo.count() == 0) {
            Ppd ppd = new Ppd();
            ppd.setDate(LocalDate.now());
            ppd.setCrateType("Apple Crate");
            ppd.setTotalProduction(2500);
            ppd.setSuccessful(2480);
            ppd.setRejected(20);
            ppdRepo.save(ppd);

            // Update produced stock manually for seeding
            inventoryRepo.findByCrateTypeAndMaterialType("Apple Crate", "Plastic").ifPresent(inv -> {
                inv.setProducedStock(2480);
                inventoryRepo.save(inv);
            });
            System.out.println("✓ PPD seeded.");
        }

        // 9. Ppm (Production per Month)
        if (ppmRepo.count() == 0) {
            Ppm ppm = new Ppm();
            ppm.setMonth(LocalDate.now().getMonth().name());
            ppm.setYear(LocalDate.now().getYear());
            ppm.setCratesProduced(75000);
            ppm.setElectricityUnits(BigDecimal.valueOf(15000));
            ppm.setElectricityBill(BigDecimal.valueOf(120000));
            ppmRepo.save(ppm);
            System.out.println("✓ PPM seeded.");
        }

        // 10. Sales
        Sales savedSale = null;
        if (salesRepo.count() == 0) {
            Sales sale = new Sales();
            sale.setDate(LocalDate.now().minusDays(2));
            partyRepo.findAll().stream().findFirst().ifPresent(sale::setParty);
            sale.setCrateType("Apple Crate");
            sale.setCrateMaterial("Plastic");
            sale.setQuantity(100);
            sale.setRate(BigDecimal.valueOf(120));
            sale.setPaid(BigDecimal.valueOf(8000)); // Total is 12000, paid 8000, remaining 4000
            savedSale = salesRepo.save(sale);

            // Update sold stock manually for seeding
            inventoryRepo.findByCrateTypeAndMaterialType("Apple Crate", "Plastic").ifPresent(inv -> {
                inv.setSoldStock(100);
                inventoryRepo.save(inv);
            });
            System.out.println("✓ Sales seeded.");
        }

        // 11. Payment Collection
        if (paymentRepo.count() == 0 && savedSale != null) {
            PaymentCollection payment = new PaymentCollection();
            payment.setParty(savedSale.getParty());
            payment.setInvoiceNo("INV-SEED-01");
            payment.setAmountReceived(BigDecimal.valueOf(8000));
            payment.setPaymentMode("UPI");
            payment.setPaymentDate(LocalDate.now().minusDays(2));
            paymentRepo.save(payment);
            System.out.println("✓ Payment Collections seeded.");
        }

        // 12. Raw Material Purchase
        if (rawMaterialRepo.count() == 0) {
            RawMaterial rm = new RawMaterial();
            rm.setDate(LocalDate.now());
            rm.setMaterialName("HDPE Plastic Granules");
            vendorRepo.findAll().stream().findFirst().ifPresent(rm::setVendor);
            rm.setWeight(BigDecimal.valueOf(2500)); // 2500kg
            rm.setRate(BigDecimal.valueOf(85));
            rawMaterialRepo.save(rm);
            System.out.println("✓ Raw Materials seeded.");
        }

        // 13. Transport
        if (transportRepo.count() == 0) {
            Transport trans = new Transport();
            trans.setDate(LocalDate.now());
            trans.setTruckNumber("MH-12-AB-1234");
            driverRepo.findAll().stream().findFirst().ifPresent(trans::setDriver);
            trans.setRent(BigDecimal.valueOf(8500));
            trans.setAdvance(BigDecimal.valueOf(3000));
            transportRepo.save(trans);
            System.out.println("✓ Transports seeded.");
        }

        // 14. Employee Salary
        if (salaryRepo.count() == 0) {
            EmployeeSalary sal = new EmployeeSalary();
            employeeRepo.findAll().stream().findFirst().ifPresent(sal::setEmployee);
            sal.setMonth("MAY");
            sal.setYear(2026);
            sal.setSalaryAmount(BigDecimal.valueOf(25000));
            sal.setStatus("Paid");
            sal.setPaidDate(LocalDate.now().minusDays(5));
            salaryRepo.save(sal);
            System.out.println("✓ Employee Salaries seeded.");
        }

        // 15. Invoice
        if (invoiceRepo.count() == 0 && savedSale != null) {
            Invoice inv = new Invoice();
            inv.setInvoiceNo("INV-SEED-01");
            inv.setSale(savedSale);
            inv.setCreatedDate(LocalDate.now().minusDays(2));
            invoiceRepo.save(inv);
            System.out.println("✓ Invoices seeded.");
        }

        // 16. Audit Log
        if (auditRepo.count() == 0) {
            AuditLog log = new AuditLog();
            log.setUsername("admin");
            log.setAction("System database bootstrap seeded successfully.");
            auditRepo.save(log);
            System.out.println("✓ Audit Logs seeded.");
        }

        // 17. Machine Master
        if (machineMasterRepo.count() == 0) {
            MachineMaster machine1 = new MachineMaster();
            machine1.setMachineName("Injection Moulding Machine 1");
            machine1.setManufacturer("IMM-001");
            machine1.setPurchaseDate(LocalDate.of(2023, 6, 1));
            machine1.setWarrantyDate(LocalDate.of(2025, 6, 1));
            machine1.setStatus("Running");
            machineMasterRepo.save(machine1);

            MachineMaster machine2 = new MachineMaster();
            machine2.setMachineName("Injection Moulding Machine 2");
            machine2.setManufacturer("IMM-002");
            machine2.setPurchaseDate(LocalDate.of(2024, 1, 10));
            machine2.setWarrantyDate(LocalDate.of(2026, 1, 10));
            machine2.setStatus("Running");
            machineMasterRepo.save(machine2);
            System.out.println("✓ Machine Masters seeded.");
        }

        // 18. Expenses
        if (expenseRepo.count() == 0) {
            Expense exp1 = new Expense();
            exp1.setDate(LocalDate.now().minusDays(3));
            exp1.setCategory("Maintenance");
            exp1.setDescription("Monthly machine lubrication and belt replacement");
            exp1.setAmount(BigDecimal.valueOf(5500));
            expenseRepo.save(exp1);

            Expense exp2 = new Expense();
            exp2.setDate(LocalDate.now().minusDays(1));
            exp2.setCategory("Office");
            exp2.setDescription("Stationery and printing expenses");
            exp2.setAmount(BigDecimal.valueOf(1200));
            expenseRepo.save(exp2);
            System.out.println("✓ Expenses seeded.");
        }

        // 19. Bank Transactions
        if (bankTransactionRepo.count() == 0) {
            BankTransaction bt1 = new BankTransaction();
            bt1.setDate(LocalDate.now().minusDays(5));
            bt1.setMode("UPI");
            bt1.setAmount(BigDecimal.valueOf(50000));
            bt1.setDescription("Payment received from Ramesh Kumar (UPI) - Ref: UPI2026060101234");
            bt1.setType("Credit");
            bankTransactionRepo.save(bt1);

            BankTransaction bt2 = new BankTransaction();
            bt2.setDate(LocalDate.now().minusDays(2));
            bt2.setMode("Bank");
            bt2.setAmount(BigDecimal.valueOf(21250));
            bt2.setDescription("Raw material purchase payment to Reliance Polymers - Ref: NEFT2026060201AB");
            bt2.setType("Debit");
            bankTransactionRepo.save(bt2);
            System.out.println("✓ Bank Transactions seeded.");
        }


        System.out.println("✨ AppStartupRunner bootstrapping complete.");
    }

    private void generateSampleExcel(File file) {
        try {
            file.getParentFile().mkdirs();
            try (Workbook workbook = new XSSFWorkbook()) {
                Sheet invSheet = workbook.createSheet("Inventory");
                Row invHeader = invSheet.createRow(0);
                invHeader.createCell(0).setCellValue("Crate Type");
                invHeader.createCell(1).setCellValue("Material Type");
                invHeader.createCell(2).setCellValue("Crate Count");

                Object[][] invData = {
                    {"Apple Crate", "Plastic", 250},
                    {"Mango Box", "Wooden", 120},
                    {"Tomato Tray", "Plastic", 450},
                    {"Grape Box", "Cardboard", 180}
                };

                int rowIdx = 1;
                for (Object[] rowData : invData) {
                    Row row = invSheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue((String) rowData[0]);
                    row.createCell(1).setCellValue((String) rowData[1]);
                    row.createCell(2).setCellValue((Integer) rowData[2]);
                }

                Sheet partySheet = workbook.createSheet("Party");
                Row partyHeader = partySheet.createRow(0);
                partyHeader.createCell(0).setCellValue("Party ID");
                partyHeader.createCell(1).setCellValue("Party Name");
                partyHeader.createCell(2).setCellValue("Party Address");
                partyHeader.createCell(3).setCellValue("Party Contact Number");

                Object[][] partyData = {
                    {101, "Ramesh Kumar", "Pune, Maharashtra", "9876543210"},
                    {102, "Suresh Sharma", "Mumbai, Maharashtra", "9123456789"},
                    {103, "Verma Agro Ind", "Nashik, Maharashtra", "8888888888"},
                    {104, "Patel Traders", "Ahmedabad, Gujarat", "9999999999"}
                };

                rowIdx = 1;
                for (Object[] rowData : partyData) {
                    Row row = partySheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue((Integer) rowData[0]);
                    row.createCell(1).setCellValue((String) rowData[1]);
                    row.createCell(2).setCellValue((String) rowData[2]);
                    row.createCell(3).setCellValue((String) rowData[3]);
                }

                for (int i = 0; i < 3; i++) invSheet.autoSizeColumn(i);
                for (int i = 0; i < 4; i++) partySheet.autoSizeColumn(i);

                try (FileOutputStream fos = new FileOutputStream(file)) {
                    workbook.write(fos);
                }
                System.out.println("Sample Excel workbook generated successfully.");
            }
        } catch (Exception e) {
            System.err.println("Error generating sample Excel file: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
