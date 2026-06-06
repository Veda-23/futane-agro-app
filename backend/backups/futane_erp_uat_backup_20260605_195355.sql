-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost    Database: futane_erp_uat
-- ------------------------------------------------------
-- Server version	8.0.34

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `audit_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `action` varchar(255) NOT NULL,
  `table_name` varchar(100) DEFAULT NULL,
  `old_value` text,
  `new_value` text,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,'admin','System database bootstrap seeded successfully.',NULL,NULL,NULL,'2026-06-05 08:53:21');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_transaction`
--

DROP TABLE IF EXISTS `bank_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_transaction` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `mode` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`transaction_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_transaction`
--

LOCK TABLES `bank_transaction` WRITE;
/*!40000 ALTER TABLE `bank_transaction` DISABLE KEYS */;
INSERT INTO `bank_transaction` VALUES (1,'2026-05-31','UPI',50000.00,'Payment received from Ramesh Kumar (UPI) - Ref: UPI2026060101234','Credit',0,NULL,NULL),(2,'2026-06-03','Bank',21250.00,'Raw material purchase payment to Reliance Polymers - Ref: NEFT2026060201AB','Debit',0,NULL,NULL);
/*!40000 ALTER TABLE `bank_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispatch`
--

DROP TABLE IF EXISTS `dispatch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dispatch` (
  `dispatch_id` int NOT NULL AUTO_INCREMENT,
  `dispatch_number` varchar(100) NOT NULL,
  `sale_id` int NOT NULL,
  `vehicle_number` varchar(50) NOT NULL,
  `driver_name` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `status` varchar(50) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`dispatch_id`),
  UNIQUE KEY `dispatch_number` (`dispatch_number`),
  KEY `sale_id` (`sale_id`),
  CONSTRAINT `dispatch_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`sale_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispatch`
--

LOCK TABLES `dispatch` WRITE;
/*!40000 ALTER TABLE `dispatch` DISABLE KEYS */;
/*!40000 ALTER TABLE `dispatch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver`
--

DROP TABLE IF EXISTS `driver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver` (
  `driver_id` int NOT NULL AUTO_INCREMENT,
  `driver_name` varchar(100) NOT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`driver_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver`
--

LOCK TABLES `driver` WRITE;
/*!40000 ALTER TABLE `driver` DISABLE KEYS */;
INSERT INTO `driver` VALUES (1,'Baldev Singh','9922110033','DL-1420230005421','Hadapsar, Pune',0,NULL,NULL);
/*!40000 ALTER TABLE `driver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_salary`
--

DROP TABLE IF EXISTS `employee_salary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_salary` (
  `salary_id` int NOT NULL AUTO_INCREMENT,
  `emp_id` int NOT NULL,
  `month` varchar(20) NOT NULL,
  `year` int NOT NULL,
  `salary_amount` decimal(10,2) NOT NULL,
  `paid_date` date DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`salary_id`),
  KEY `emp_id` (`emp_id`),
  CONSTRAINT `employee_salary_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employees` (`emp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_salary`
--

LOCK TABLES `employee_salary` WRITE;
/*!40000 ALTER TABLE `employee_salary` DISABLE KEYS */;
INSERT INTO `employee_salary` VALUES (1,1,'MAY',2026,25000.00,'2026-05-31','Paid',0,NULL,NULL);
/*!40000 ALTER TABLE `employee_salary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `emp_id` int NOT NULL AUTO_INCREMENT,
  `emp_name` varchar(100) NOT NULL,
  `emp_contact` varchar(20) DEFAULT NULL,
  `salary` decimal(10,2) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `aadhaar_no` varchar(20) DEFAULT NULL,
  `bank_account` varchar(255) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `aadhaar_card_path` varchar(255) DEFAULT NULL,
  `bank_passbook_path` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`emp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'Amit Patel','9823456789',25000.00,'Pune, Maharashtra','Operator','2025-01-15','123456789012','52MaHLxKR/gfJgwEizJakQ==',NULL,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense`
--

DROP TABLE IF EXISTS `expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense` (
  `expense_id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`expense_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense`
--

LOCK TABLES `expense` WRITE;
/*!40000 ALTER TABLE `expense` DISABLE KEYS */;
INSERT INTO `expense` VALUES (1,'2026-06-02','Maintenance',5500.00,'Monthly machine lubrication and belt replacement',0,NULL,NULL),(2,'2026-06-04','Office',1200.00,'Stationery and printing expenses',0,NULL,NULL);
/*!40000 ALTER TABLE `expense` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `inventory_id` int NOT NULL AUTO_INCREMENT,
  `crate_type` varchar(100) NOT NULL,
  `material_type` varchar(100) NOT NULL,
  `opening_stock` int NOT NULL DEFAULT '0',
  `produced_stock` int NOT NULL DEFAULT '0',
  `sold_stock` int NOT NULL DEFAULT '0',
  `current_stock` int NOT NULL DEFAULT '0',
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`inventory_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES (1,'Apple Crate','Plastic',5000,2480,100,7380,'2026-06-05 08:53:21',0,NULL,NULL),(2,'Tomato Tray','Plastic',2500,0,0,2500,'2026-06-05 08:53:21',0,NULL,NULL);
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice`
--

DROP TABLE IF EXISTS `invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice` (
  `invoice_id` int NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(100) NOT NULL,
  `sale_id` int NOT NULL,
  `created_date` date NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `sale_id` (`sale_id`),
  CONSTRAINT `invoice_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`sale_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice`
--

LOCK TABLES `invoice` WRITE;
/*!40000 ALTER TABLE `invoice` DISABLE KEYS */;
INSERT INTO `invoice` VALUES (1,'INV-SEED-01',1,'2026-06-03',0,NULL,NULL);
/*!40000 ALTER TABLE `invoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machine_breakdown`
--

DROP TABLE IF EXISTS `machine_breakdown`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_breakdown` (
  `breakdown_id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `machine_id` int NOT NULL,
  `issue` varchar(255) NOT NULL,
  `resolved_by` varchar(100) DEFAULT NULL,
  `downtime` int DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`breakdown_id`),
  KEY `machine_id` (`machine_id`),
  CONSTRAINT `machine_breakdown_ibfk_1` FOREIGN KEY (`machine_id`) REFERENCES `machine_master` (`machine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machine_breakdown`
--

LOCK TABLES `machine_breakdown` WRITE;
/*!40000 ALTER TABLE `machine_breakdown` DISABLE KEYS */;
/*!40000 ALTER TABLE `machine_breakdown` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machine_master`
--

DROP TABLE IF EXISTS `machine_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_master` (
  `machine_id` int NOT NULL AUTO_INCREMENT,
  `machine_name` varchar(100) NOT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `warranty_date` date DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`machine_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machine_master`
--

LOCK TABLES `machine_master` WRITE;
/*!40000 ALTER TABLE `machine_master` DISABLE KEYS */;
INSERT INTO `machine_master` VALUES (1,'Injection Moulding Machine 1','IMM-001','2023-06-01','2025-06-01','Running',0,NULL,NULL),(2,'Injection Moulding Machine 2','IMM-002','2024-01-10','2026-01-10','Running',0,NULL,NULL);
/*!40000 ALTER TABLE `machine_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `party`
--

DROP TABLE IF EXISTS `party`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `party` (
  `party_id` int NOT NULL AUTO_INCREMENT,
  `party_name` varchar(100) NOT NULL,
  `party_address` varchar(255) DEFAULT NULL,
  `party_contact` varchar(20) DEFAULT NULL,
  `gst_number` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_date` date DEFAULT NULL,
  `gst_cert_path` varchar(255) DEFAULT NULL,
  `pan_card_path` varchar(255) DEFAULT NULL,
  `agreement_path` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`party_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `party`
--

LOCK TABLES `party` WRITE;
/*!40000 ALTER TABLE `party` DISABLE KEYS */;
INSERT INTO `party` VALUES (1,'Ramesh Kumar','Pune, Maharashtra','9876543210','5jIVP7Ieb/MXok76tsJPYQ==','ramesh@agro.com','Pune','Maharashtra',1,'2026-05-26',NULL,NULL,NULL,0,NULL,NULL),(2,'Patel Traders','Ahmedabad, Gujarat','9999999999','jMh+soCfDM3iRJxMVCtCbw==','patel@traders.com','Ahmedabad','Gujarat',1,'2026-05-31',NULL,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `party` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_collection`
--

DROP TABLE IF EXISTS `payment_collection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_collection` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `party_id` int NOT NULL,
  `invoice_no` varchar(100) DEFAULT NULL,
  `amount_received` decimal(10,2) NOT NULL,
  `payment_mode` varchar(50) NOT NULL,
  `payment_date` date NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `party_id` (`party_id`),
  CONSTRAINT `payment_collection_ibfk_1` FOREIGN KEY (`party_id`) REFERENCES `party` (`party_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_collection`
--

LOCK TABLES `payment_collection` WRITE;
/*!40000 ALTER TABLE `payment_collection` DISABLE KEYS */;
INSERT INTO `payment_collection` VALUES (1,1,'INV-SEED-01',8000.00,'UPI','2026-06-03',0,NULL,NULL);
/*!40000 ALTER TABLE `payment_collection` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ppd`
--

DROP TABLE IF EXISTS `ppd`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ppd` (
  `ppd_id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `crate_type` varchar(100) NOT NULL,
  `total_production` int NOT NULL,
  `successful` int NOT NULL,
  `rejected` int NOT NULL,
  `shift` varchar(50) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`ppd_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ppd`
--

LOCK TABLES `ppd` WRITE;
/*!40000 ALTER TABLE `ppd` DISABLE KEYS */;
INSERT INTO `ppd` VALUES (1,'2026-06-05','Apple Crate',2500,2480,20,'Morning Shift',0,NULL,NULL);
/*!40000 ALTER TABLE `ppd` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ppm`
--

DROP TABLE IF EXISTS `ppm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ppm` (
  `ppm_id` int NOT NULL AUTO_INCREMENT,
  `month` varchar(20) NOT NULL,
  `year` int NOT NULL,
  `crates_produced` int NOT NULL,
  `electricity_units` decimal(10,2) NOT NULL,
  `electricity_bill` decimal(10,2) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`ppm_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ppm`
--

LOCK TABLES `ppm` WRITE;
/*!40000 ALTER TABLE `ppm` DISABLE KEYS */;
INSERT INTO `ppm` VALUES (1,'JUNE',2026,75000,15000.00,120000.00,0,NULL,NULL);
/*!40000 ALTER TABLE `ppm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `raw_material`
--

DROP TABLE IF EXISTS `raw_material`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `raw_material` (
  `raw_material_id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `material_name` varchar(100) NOT NULL,
  `vendor_id` int NOT NULL,
  `weight` decimal(10,2) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `purchase_bill_path` varchar(255) DEFAULT NULL,
  `weight_slip_path` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`raw_material_id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `raw_material_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor` (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `raw_material`
--

LOCK TABLES `raw_material` WRITE;
/*!40000 ALTER TABLE `raw_material` DISABLE KEYS */;
INSERT INTO `raw_material` VALUES (1,'2026-06-05','HDPE Plastic Granules',1,2500.00,85.00,212500.00,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `raw_material` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `sale_id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `party_id` int NOT NULL,
  `crate_type` varchar(100) NOT NULL,
  `crate_material` varchar(100) NOT NULL,
  `quantity` int NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `paid` decimal(10,2) NOT NULL DEFAULT '0.00',
  `remaining` decimal(10,2) NOT NULL DEFAULT '0.00',
  `hsn_code` varchar(50) DEFAULT NULL,
  `gst_rate` decimal(5,2) DEFAULT NULL,
  `cgst` decimal(10,2) DEFAULT NULL,
  `sgst` decimal(10,2) DEFAULT NULL,
  `invoice_copy_path` varchar(255) DEFAULT NULL,
  `delivery_challan_path` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`sale_id`),
  KEY `party_id` (`party_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`party_id`) REFERENCES `party` (`party_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES (1,'2026-06-03',1,'Apple Crate','Plastic',100,120.00,14160.00,8000.00,6160.00,NULL,18.00,1080.00,1080.00,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `config_key` varchar(100) NOT NULL,
  `config_value` text,
  PRIMARY KEY (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transport`
--

DROP TABLE IF EXISTS `transport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport` (
  `transport_id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `truck_number` varchar(50) NOT NULL,
  `driver_id` int NOT NULL,
  `rent` decimal(10,2) NOT NULL,
  `advance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `remaining` decimal(10,2) NOT NULL DEFAULT '0.00',
  `truck_photo_path` varchar(255) DEFAULT NULL,
  `driver_license_path` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`transport_id`),
  KEY `driver_id` (`driver_id`),
  CONSTRAINT `transport_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `driver` (`driver_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transport`
--

LOCK TABLES `transport` WRITE;
/*!40000 ALTER TABLE `transport` DISABLE KEYS */;
INSERT INTO `transport` VALUES (1,'2026-06-05','MH-12-AB-1234',1,8500.00,3000.00,5500.00,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `transport` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `failed_attempts` int DEFAULT '0',
  `account_locked` tinyint(1) DEFAULT '0',
  `lock_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('ACCOUNTANT','$2a$10$hkvTzV6CdKCLtwJUG5e/iOy.k7.0mP43DQddMsiK9o8MQWWq2lKse','ACCOUNTANT','Accountant User',0,0,NULL),('ADMIN','$2a$10$O45fu1tyKTReKITCEqEyuubm9tHUWF/HKE6hWqcCIgvlMdeBC37Em','ADMIN','Admin User',0,0,NULL),('OPERATOR','$2a$10$pifQGUxlQ836KkDbQ2WSWOJCOQBBRROEgwIKtVvecTxH/btyGXgRK','OPERATOR','Operator User',0,0,NULL),('SUPER_ADMIN','$2a$10$8hQmlaGt3Pv8WGeWex8qX.C4PIOBkVPdaRmBmORKyo/zvwPpY9gc2','SUPER_ADMIN','Super Admin',0,0,NULL),('UAT_ADMIN','$2a$10$CiodCqzNsdGDYZ7WE4Ls2eQWVLoZKk0U8KXTq0JIJPtd24O1Q9/B2','ADMIN','UAT Admin User',0,0,NULL),('UAT_OPERATOR','$2a$10$GIyS3UcLPD8iaJzeyyp0U.HxlJOLQMl56w.iRYfdMvsL7BPftUps2','OPERATOR','UAT Operator User',0,0,NULL),('VIEWER','$2a$10$lENoCGPwbYkr2.OmW0sUae3.1xOM7J1782oo.1.ldnmVbWHUy91xy','VIEWER','Viewer User',0,0,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor`
--

DROP TABLE IF EXISTS `vendor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor` (
  `vendor_id` int NOT NULL AUTO_INCREMENT,
  `vendor_name` varchar(100) NOT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `gst_number` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` date DEFAULT NULL,
  PRIMARY KEY (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor`
--

LOCK TABLES `vendor` WRITE;
/*!40000 ALTER TABLE `vendor` DISABLE KEYS */;
INSERT INTO `vendor` VALUES (1,'Reliance Polymers','9890123456','Mumbai, Maharashtra','7qsATVaZo4l2Jrznp8zzuQ==',0,NULL,NULL);
/*!40000 ALTER TABLE `vendor` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-05 19:53:55
