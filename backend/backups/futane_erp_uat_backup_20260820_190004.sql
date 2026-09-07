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
  `id` char(36) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `is_deleted` bit(1) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT NULL,
  PRIMARY KEY (`audit_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,'admin','System database bootstrap seeded successfully.',NULL,NULL,NULL,'2026-08-15 06:33:09','a18fa187-275a-4faa-b36c-cf8bea9798a2',NULL,NULL,NULL,NULL,_binary '',_binary '\0',NULL,NULL,0),(2,'SUPER_ADMIN','Enterprise dummy dataset populated successfully across 18 database tables.',NULL,NULL,NULL,'2026-08-19 10:26:12','c1dcdd33-5d21-434e-9945-10c2994d67c3','2026-08-19 15:56:11.515094',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'SUPER_ADMIN','Enterprise dummy dataset populated successfully across 18 database tables.',NULL,NULL,NULL,'2026-08-19 10:26:31','9b4afdaa-9723-4835-8819-c07f8f4c47ce','2026-08-19 15:56:30.575245',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'ADMIN','Logged in successfully',NULL,NULL,NULL,'2026-08-19 10:32:16','bcfc8e35-8170-4be5-a09a-dd6c3701fa57','2026-08-19 16:02:15.738058',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,'ADMIN','Logged out',NULL,NULL,NULL,'2026-08-19 10:46:42','46a011c0-c326-4b3d-80a3-c534d0f9d1fc','2026-08-19 16:16:41.535812',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,'ADMIN','Logged in successfully',NULL,NULL,NULL,'2026-08-19 11:00:55','3c29703d-1236-4a4b-92ad-28eaea7978e3','2026-08-19 16:30:55.380095',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,'ADMIN','Logged out',NULL,NULL,NULL,'2026-08-19 11:08:54','670c7502-c170-4e8d-9869-797f3eb9652c','2026-08-19 16:38:53.703559',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,'ADMIN','Logged in successfully',NULL,NULL,NULL,'2026-08-19 11:17:54','c69e6d21-fc96-4f76-90fd-69b7219ec22a','2026-08-19 16:47:53.669037',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(9,'ADMIN','Created payment record for party ID: c08c067e-233d-479a-b675-143367d4a036','Payment_Collection',NULL,'{\"id\":\"8df35aaa-edda-4a7d-9bff-74bf5dc912f0\",\"createdAt\":\"2026-08-19T22:19:17.8458436\",\"updatedAt\":\"2026-08-19T22:19:17.8458436\",\"createdBy\":\"ADMIN\",\"updatedBy\":\"ADMIN\",\"version\":0,\"isActive\":true,\"isDeleted\":false,\"deletedBy\":null,\"deletedDate\":null,\"paymentId\":null,\"party\":{\"id\":\"c08c067e-233d-479a-b675-143367d4a036\",\"createdAt\":null,\"updatedAt\":null,\"createdBy\":null,\"updatedBy\":null,\"version\":0,\"isActive\":true,\"isDeleted\":false,\"deletedBy\":null,\"deletedDate\":null,\"partyId\":1,\"partyName\":\"Ramesh Kumar\",\"partyAddress\":\"Pune, Maharashtra\",\"partyContact\":\"9876543210\",\"gstNumber\":\"27AAAAA1111A1Z1\",\"email\":\"ramesh@agro.com\",\"city\":\"Pune\",\"state\":\"Maharashtra\",\"createdDate\":\"2026-08-05\",\"gstCertPath\":null,\"panCardPath\":null,\"agreementPath\":null},\"invoiceNo\":\"INV-91\",\"amountReceived\":12474,\"paymentMode\":\"Online (Razorpay / UPI)\",\"paymentDate\":\"2026-08-19\"}','2026-08-19 11:19:18','ae8cb21c-75f8-44df-b61a-4c50174d043e','2026-08-19 16:49:17.978818',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,'SUPER_ADMIN','Enterprise dummy dataset populated successfully across 18 database tables.',NULL,NULL,NULL,'2026-08-19 11:21:10','decb08f8-f6e8-49d5-8e85-522657987a5b','2026-08-19 16:51:10.078732',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(11,'SUPER_ADMIN','Enterprise dummy dataset populated successfully across 18 database tables.',NULL,NULL,NULL,'2026-08-20 07:14:02','e3749109-9762-484a-aa7f-a305c6c627be','2026-08-20 12:44:01.824224',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(12,'SUPER_ADMIN','Enterprise dummy dataset populated successfully across 18 database tables.',NULL,NULL,NULL,'2026-08-20 07:22:34','457e5d9c-2404-4ba5-83bc-a14a0178f6e8','2026-08-20 12:52:34.288122',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(13,'SUPER_ADMIN','Logged in successfully',NULL,NULL,NULL,'2026-08-20 07:43:25','2647824e-5b62-4612-877d-7cd7d4635111','2026-08-20 13:13:24.826091',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(14,'ADMIN','Logged in successfully',NULL,NULL,NULL,'2026-08-20 07:48:52','4f0ce908-8f30-4928-a18f-c815643ce251','2026-08-20 13:18:52.306263',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(15,'ADMIN','Logged out',NULL,NULL,NULL,'2026-08-20 07:50:33','32b4cadf-5f38-4f1f-b9fc-73529529fe0e','2026-08-20 13:20:32.513815',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(16,'SUPER_ADMIN','Logged in successfully',NULL,NULL,NULL,'2026-08-20 07:51:00','60f0611c-d160-4ca7-8396-ee26bccf38b8','2026-08-20 13:21:00.072837',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(17,'SUPER_ADMIN','Toggled Dark Mode: true',NULL,NULL,NULL,'2026-08-20 07:55:25','677068ef-7364-4ed2-8497-228c05dfd06f','2026-08-20 13:25:25.031466',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(18,'SUPER_ADMIN','Toggled Dark Mode: false',NULL,NULL,NULL,'2026-08-20 07:55:26','719c7052-eb17-4bfc-88e9-a083a40274b9','2026-08-20 13:25:25.888524',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_transaction`
--

LOCK TABLES `bank_transaction` WRITE;
/*!40000 ALTER TABLE `bank_transaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `bank_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `databasechangelog`
--

DROP TABLE IF EXISTS `databasechangelog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `databasechangelog` (
  `ID` varchar(255) NOT NULL,
  `AUTHOR` varchar(255) NOT NULL,
  `FILENAME` varchar(255) NOT NULL,
  `DATEEXECUTED` datetime NOT NULL,
  `ORDEREXECUTED` int NOT NULL,
  `EXECTYPE` varchar(10) NOT NULL,
  `MD5SUM` varchar(35) DEFAULT NULL,
  `DESCRIPTION` varchar(255) DEFAULT NULL,
  `COMMENTS` varchar(255) DEFAULT NULL,
  `TAG` varchar(255) DEFAULT NULL,
  `LIQUIBASE` varchar(20) DEFAULT NULL,
  `CONTEXTS` varchar(255) DEFAULT NULL,
  `LABELS` varchar(255) DEFAULT NULL,
  `DEPLOYMENT_ID` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `databasechangelog`
--

LOCK TABLES `databasechangelog` WRITE;
/*!40000 ALTER TABLE `databasechangelog` DISABLE KEYS */;
INSERT INTO `databasechangelog` VALUES ('01-init-schemas-users','admin','db/changelog/releases/v1.0/01-init-schemas-users.sql','2026-07-23 01:08:24',1,'EXECUTED','8:8eb62453f11cc3756a5514050a319c3d','sql','',NULL,'4.9.1',NULL,NULL,'4749104302');
/*!40000 ALTER TABLE `databasechangelog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `databasechangeloglock`
--

DROP TABLE IF EXISTS `databasechangeloglock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `databasechangeloglock` (
  `ID` int NOT NULL,
  `LOCKED` bit(1) NOT NULL,
  `LOCKGRANTED` datetime DEFAULT NULL,
  `LOCKEDBY` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `databasechangeloglock`
--

LOCK TABLES `databasechangeloglock` WRITE;
/*!40000 ALTER TABLE `databasechangeloglock` DISABLE KEYS */;
INSERT INTO `databasechangeloglock` VALUES (1,_binary '\0',NULL,NULL);
/*!40000 ALTER TABLE `databasechangeloglock` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver`
--

LOCK TABLES `driver` WRITE;
/*!40000 ALTER TABLE `driver` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_salary`
--

LOCK TABLES `employee_salary` WRITE;
/*!40000 ALTER TABLE `employee_salary` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense`
--

LOCK TABLES `expense` WRITE;
/*!40000 ALTER TABLE `expense` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice`
--

LOCK TABLES `invoice` WRITE;
/*!40000 ALTER TABLE `invoice` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machine_master`
--

LOCK TABLES `machine_master` WRITE;
/*!40000 ALTER TABLE `machine_master` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `party`
--

LOCK TABLES `party` WRITE;
/*!40000 ALTER TABLE `party` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_collection`
--

LOCK TABLES `payment_collection` WRITE;
/*!40000 ALTER TABLE `payment_collection` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ppd`
--

LOCK TABLES `ppd` WRITE;
/*!40000 ALTER TABLE `ppd` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ppm`
--

LOCK TABLES `ppm` WRITE;
/*!40000 ALTER TABLE `ppm` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `raw_material`
--

LOCK TABLES `raw_material` WRITE;
/*!40000 ALTER TABLE `raw_material` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_audit_logs`
--

DROP TABLE IF EXISTS `security_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `affected_resource` varchar(100) DEFAULT NULL,
  `client_ip` varchar(64) DEFAULT NULL,
  `details` varchar(1000) DEFAULT NULL,
  `event_type` varchar(60) NOT NULL,
  `request_uri` varchar(200) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `severity` varchar(10) NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_username` (`username`),
  KEY `idx_audit_event_type` (`event_type`),
  KEY `idx_audit_timestamp` (`timestamp`),
  KEY `idx_audit_ip` (`client_ip`),
  KEY `idx_audit_severity` (`severity`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_audit_logs`
--

LOCK TABLES `security_audit_logs` WRITE;
/*!40000 ALTER TABLE `security_audit_logs` DISABLE KEYS */;
INSERT INTO `security_audit_logs` VALUES (1,NULL,'0:0:0:0:0:0:0:1','Successful 2FA login completed','LOGIN_SUCCESS','/api/users/login/verify',NULL,'INFO','2026-08-20 12:53:07.008339','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9168','SUPER_ADMIN'),(2,NULL,'0:0:0:0:0:0:0:1','Successful 2FA login completed','LOGIN_SUCCESS','/api/users/login/verify',NULL,'INFO','2026-08-20 13:04:50.510438','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.9168','SUPER_ADMIN'),(3,NULL,'0:0:0:0:0:0:0:1','Successful 2FA login completed','LOGIN_SUCCESS','/api/users/login/verify',NULL,'INFO','2026-08-20 13:13:21.147796','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','SUPER_ADMIN'),(4,NULL,'0:0:0:0:0:0:0:1','Successful 2FA login completed','LOGIN_SUCCESS','/api/users/login/verify',NULL,'INFO','2026-08-20 13:18:50.916378','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','ADMIN'),(5,NULL,'0:0:0:0:0:0:0:1','Successful 2FA login completed','LOGIN_SUCCESS','/api/users/login/verify',NULL,'INFO','2026-08-20 13:20:57.475164','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','SUPER_ADMIN');
/*!40000 ALTER TABLE `security_audit_logs` ENABLE KEYS */;
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
-- Table structure for table `t_aud_entity_history`
--

DROP TABLE IF EXISTS `t_aud_entity_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_aud_entity_history` (
  `id` char(36) NOT NULL,
  `entity_id` char(36) NOT NULL,
  `entity_name` varchar(100) NOT NULL,
  `action` varchar(20) NOT NULL,
  `changed_by` char(36) DEFAULT NULL,
  `old_payload` json DEFAULT NULL,
  `new_payload` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_aud_entity_history`
--

LOCK TABLES `t_aud_entity_history` WRITE;
/*!40000 ALTER TABLE `t_aud_entity_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_aud_entity_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_branches`
--

DROP TABLE IF EXISTS `t_branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_branches` (
  `id` char(36) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `is_deleted` bit(1) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT NULL,
  `branch_code` varchar(255) NOT NULL,
  `branch_name` varchar(255) NOT NULL,
  `is_main_plant` bit(1) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_j0rqg4s2ddfcn7s8i1eb2nmb7` (`branch_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_branches`
--

LOCK TABLES `t_branches` WRITE;
/*!40000 ALTER TABLE `t_branches` DISABLE KEYS */;
INSERT INTO `t_branches` VALUES ('05da4f3e-bd5f-4c8a-8dba-208b7e2db634','2026-08-19 15:56:11.492368','system',NULL,NULL,_binary '',_binary '\0','2026-08-19 15:56:11.492368','system',0,'BRM-COLD-02','Baramati Cold Storage & Packaging Hub',_binary '\0','Baramati Agro MIDC, Pune'),('2944271d-e6ff-48dc-b080-d0c60070ac5d','2026-08-19 15:56:11.495128','system',NULL,NULL,_binary '',_binary '\0','2026-08-19 15:56:11.495128','system',0,'NSK-EXP-03','Nashik Export Logistics Center',_binary '\0','Mohadi Agro Park, Nashik'),('2a22c60c-594b-441a-b1b7-57900df6ca5a','2026-08-19 15:56:11.488867','system',NULL,NULL,_binary '',_binary '\0','2026-08-19 15:56:11.488867','system',0,'PUN-HQ-01','Pune Central Processing Plant & HQ',_binary '','Chakan Industrial Phase 2, Pune');
/*!40000 ALTER TABLE `t_branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_core_user`
--

DROP TABLE IF EXISTS `t_core_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_core_user` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `failed_attempts` int DEFAULT NULL,
  `account_locked` tinyint(1) DEFAULT '0',
  `lock_time` timestamp NULL DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` datetime DEFAULT NULL,
  `force_password_change` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_core_user`
--

LOCK TABLES `t_core_user` WRITE;
/*!40000 ALTER TABLE `t_core_user` DISABLE KEYS */;
INSERT INTO `t_core_user` VALUES ('28ccbfa9-225d-4cca-8c40-94393d419545',NULL,NULL,NULL,NULL,0,1,'OPERATOR','$2a$10$r62be9Dn3OoKc6YlLiSAgueflm.LZKWRyzO4sQ84z6QZejZvNWP7C','OPERATOR','Operator User',0,0,NULL,'vedantmehare25@gmail.com',NULL,0,NULL,NULL,NULL),('4375e755-1b9f-4bf1-94ac-41ac26a68616',NULL,NULL,NULL,NULL,0,1,'ACCOUNTANT','$2a$10$68nFIIizEXpHesuwfyOWJOW1HtlPqS/C3LpFjkeXBp6OIWY1NJozq','ACCOUNTANT','Accountant User',0,0,NULL,'vedantmehare25@gmail.com',NULL,0,NULL,NULL,NULL),('531f51f8-9ed0-4b8f-97e8-e6fc79b79721',NULL,NULL,NULL,NULL,0,1,'UAT_OPERATOR','$2a$10$9XfVkNhltmpUE1HnDkTQLukCSuryhHEh5hvzWHjsE0cWTNKqMD192','OPERATOR','UAT Operator User',0,0,NULL,'vedantmehare25@gmail.com',NULL,0,NULL,NULL,NULL),('64726808-472a-4ccb-a94b-ea54569c6616',NULL,NULL,NULL,NULL,0,1,'SUPER_ADMIN','$2a$10$6WtdXIZ48YmQaCWwAFNJd.sTFJfgNyeigp2Rt06kt/d.Tb2UYa/mC','SUPER_ADMIN','Super Admin',0,0,NULL,'vedantmehare25@gmail.com',NULL,0,NULL,NULL,NULL),('71a2e6c8-0d12-4260-ab8b-83ef188c1c19',NULL,'2026-08-19 11:17:34',NULL,'system',6,1,'ADMIN','$2a$10$UNsqFttoe0/gze71kqJb5uIFhnbCuowVAozPl0pQcwJtjcvsdZVBi','ADMIN','Admin User',0,0,NULL,'vedantmehare25@gmail.com',NULL,0,NULL,NULL,NULL),('805be153-3c9f-4d70-ba4d-bfd325201697',NULL,NULL,NULL,NULL,0,1,'UAT_ADMIN','$2a$10$mkE1ukJD.3v2ZOf9pL.nlejHB0BBYWfFflSfrH0TqyaeC7Iy8fMO6','ADMIN','UAT Admin User',0,0,NULL,'vedantmehare25@gmail.com',NULL,0,NULL,NULL,NULL),('b544b8b5-ee00-406b-a44e-23593cdeecc1',NULL,NULL,NULL,NULL,0,1,'VIEWER','$2a$10$sFz1e2DA.ova2hwIK18KPOU/gEIHPTWAdfhyvuqI05JWeLMFYsCd.','VIEWER','Viewer User',0,0,NULL,'vedantmehare25@gmail.com',NULL,0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `t_core_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_crm_party`
--

DROP TABLE IF EXISTS `t_crm_party`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_crm_party` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `party_id` int NOT NULL AUTO_INCREMENT,
  `party_name` varchar(255) NOT NULL,
  `party_address` varchar(255) NOT NULL,
  `party_contact` varchar(255) NOT NULL,
  `gst_number` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `state` varchar(255) NOT NULL,
  `created_date` date NOT NULL,
  `gst_cert_path` varchar(255) DEFAULT NULL,
  `pan_card_path` varchar(255) DEFAULT NULL,
  `agreement_path` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `party_id` (`party_id`),
  UNIQUE KEY `UK5ede869csdee74irklk51lw0o` (`party_name`),
  UNIQUE KEY `UKaga4oebhpv3oona9ydxn7q23l` (`party_contact`),
  UNIQUE KEY `UKjbnq9p35j81e8iyot8nldrhxd` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_crm_party`
--

LOCK TABLES `t_crm_party` WRITE;
/*!40000 ALTER TABLE `t_crm_party` DISABLE KEYS */;
INSERT INTO `t_crm_party` VALUES ('27b32046-75f4-480d-ba20-4eb1f562cb53','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,60,'Kalyan Agri Traders','Market Yard, Gultekdi, Pune','9422001122','ZEyDU/wEtdcIXvF54iEaggBTafcK25vfkqbsey2xSAI=','kalyan.traders@yahoo.com','Pune','Maharashtra','2026-08-03',NULL,NULL,NULL,0,NULL,NULL),('2f5d7b43-9788-43c6-9d2b-1266a3bca6be','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,58,'Heritage Foods Retail Ltd.','Panjagutta, Hyderabad, Telangana','9848012345','aabMUYffAzVoOf+zgr7Yi8t9N82VQ1u6szjxhfFop7Q=','scm@heritagefoods.in','Hyderabad','Telangana','2026-07-30',NULL,NULL,NULL,0,NULL,NULL),('3661a382-8d19-476a-ae9d-9a8c8b1e511e','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,62,'Adani Agri Fresh Logistics','Taloja MIDC, Navi Mumbai','9820099881','zrFMh0KAgdJNUMIP25BiPLNvrLBI7b/2B0sfJIO1EFY=','agrifresh@adani.com','Navi Mumbai','Maharashtra','2026-08-07',NULL,NULL,NULL,0,NULL,NULL),('4e59c02c-0e74-44c8-95d7-193c1100f30d','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,61,'Zomato Hyperpure Agro','Wagholi Cold Center, Pune','9819003344','0C+Jdt8MHNsfkoIHdH2cPy+8b7iDcHBG9zubDSXeMkA=','hyperpure.agro@zomato.com','Pune','Maharashtra','2026-08-05',NULL,NULL,NULL,0,NULL,NULL),('5de8cf14-b801-4095-a9cd-9f24d2011148','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,54,'Sahyadri Farms Post Harvest Care','Mohadi, Nashik, Maharashtra','9890123456','gitrptyleQA4SlIqrBCv3yfb7jKykPteKTKCOS6lGpw=','sales@sahyadrifarms.com','Nashik','Maharashtra','2026-07-22',NULL,NULL,NULL,0,NULL,NULL),('65e62f79-3410-40a5-9963-e731a117031e','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,56,'BigBasket (Supermarket Grocery)','Chakan Industrial Area, Pune','9860112233','O5Tb07i/2vNxUCfeQGQPLcMWaQ9Sgkd7mQFR/K6vavs=','vendor.desk@bigbasket.com','Pune','Maharashtra','2026-07-26',NULL,NULL,NULL,0,NULL,NULL),('8f201413-4fbf-4bd6-95e0-940d9cdd88c3',NULL,NULL,NULL,NULL,0,1,2,'Patel Traders','Ahmedabad, Gujarat','9999999999','jMh+soCfDM3iRJxMVCtCbw==','patel@traders.com','Ahmedabad','Gujarat','2026-08-10',NULL,NULL,NULL,0,NULL,NULL),('a54f65f9-b4ae-4b52-be61-de9fa5647654','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,55,'Reliance Fresh Distribution Hub','Kalyan-Bhiwandi Rd, Thane, Maharashtra','9136098765','U3vgMTxByyTN+n+t331gX8EohYg0ggXrgJNxLrVOK+E=','fresh.procure@ril.com','Thane','Maharashtra','2026-07-24',NULL,NULL,NULL,0,NULL,NULL),('af7206bd-e2c7-4a60-98e8-2bda019c6fdf','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,57,'FreshToHome Agro Foods','Yeshwanthpur, Bengaluru, Karnataka','9900118822','7KJYCLxx+DDm4GiIjtmBO5h8eeGF6GnNb22nSqMRHCs=','procure.south@freshtohome.com','Bengaluru','Karnataka','2026-07-28',NULL,NULL,NULL,0,NULL,NULL),('c08c067e-233d-479a-b675-143367d4a036',NULL,NULL,NULL,NULL,0,1,1,'Ramesh Kumar','Pune, Maharashtra','9876543210','5jIVP7Ieb/MXok76tsJPYQ==','ramesh@agro.com','Pune','Maharashtra','2026-08-05',NULL,NULL,NULL,0,NULL,NULL),('d5039da9-37b6-4343-9b7f-3f7c37ae9549','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,53,'Mahindra Agri Solutions Ltd.','MIDC Bhosari, Pune, Maharashtra','9822014589','I7GjH2T9KDd5NVXpFqV44Ws0ASNy02IieX5hzUHObvI=','procurement@mahindraagri.com','Pune','Maharashtra','2026-07-20',NULL,NULL,NULL,0,NULL,NULL),('e133a43e-a55d-4bfb-855f-c05e1263024c','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,59,'Gujarat Agro Cold Chain Exporters','Naroda GIDC, Ahmedabad, Gujarat','9727054321','iNFKNNrv3EZclFznUsEx9mFsUMgK5jLM6Ek1uMHnDH4=','export@gujagro.com','Ahmedabad','Gujarat','2026-08-01',NULL,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `t_crm_party` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_crm_vendor`
--

DROP TABLE IF EXISTS `t_crm_vendor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_crm_vendor` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `vendor_id` int NOT NULL AUTO_INCREMENT,
  `vendor_name` varchar(255) NOT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `gst_number` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vendor_id` (`vendor_id`),
  UNIQUE KEY `UK7g1gneyk6ytjws5afp37xgua6` (`vendor_name`),
  UNIQUE KEY `UKrfr1gki1fox4e77l8f3cwse1p` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_crm_vendor`
--

LOCK TABLES `t_crm_vendor` WRITE;
/*!40000 ALTER TABLE `t_crm_vendor` DISABLE KEYS */;
INSERT INTO `t_crm_vendor` VALUES ('1ce3c56f-9e91-4285-9368-14194a38b177','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,47,'Nilkamal Material Handling Crates','9823098765','Sinnar, Nashik, Maharashtra','dzYTcisNGAS77mojJortOgxdC697qGMgoj+NkNSOFGc=',0,NULL,NULL),('4b27033a-c62f-4139-be0c-b7c40b3d4918','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,48,'Cryogas Nitrogen & Cold Storage Supplies','9860012345','Ranjangaon MIDC, Pune','zKYYkVhY7ATmzRUvlmo4nFBb0rvvSEVCw92+CoOqoTU=',0,NULL,NULL),('5bf2f118-f1ba-4a35-bae2-b2a2ff7f18ac','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,49,'Balaji Agro Seeds & Fertilizers','9423011223','Baramati Agro Hub, Pune','zLU0fCPOImnb4nBxGJnuOkygCDveMjXzIsm0t7VAGpE=',0,NULL,NULL),('79a534ec-9a72-4ec2-87b4-2e24746d47c7','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,46,'Time Technoplast Agro Crates','9904011223','Silvassa, D&NH','+a1ZD/HtqRtyHvh3bw08y6hWhr5edKbv2cLwZgDu6/I=',0,NULL,NULL),('c35252e6-462b-434a-8452-086670b7b63f','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,45,'Navkar Polymers Masterbatch & Granules','9825112233','Vapi GIDC, Gujarat','icaOh+uoGo4JGneIBM5Cwq8Wm+xRfoZNKdrDPu7wXqo=',0,NULL,NULL),('cc5af39f-476c-46b3-b0fc-65c414dca928','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,44,'Uflex Corrugated Packaging Systems','9898012345','Sanand Industrial Park, Ahmedabad','VT1XGC6ooIA32UhtOEuuzZeM0HKzeYa4WqEqAZRtm7E=',0,NULL,NULL),('d4cca1e1-fc6e-4c05-8dae-8af0ea05a8c4','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,43,'Sintex BAPL Industrial Containers','9978901234','Kalol, Gandhinagar, Gujarat','NWlwKGvVjAovVRYWPGcstFIpeddQfht16xXCduZXzWk=',0,NULL,NULL),('f1ae39ce-0ca2-4964-9665-432dc8bb9363','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,42,'Supreme Polymers Packaging Ltd.','9822554411','Chakan MIDC Phase 2, Pune','I5sJR0eDCUoNdY2wd407fSx2kOedMCg2zv9CJjmSaT8=',0,NULL,NULL),('f53a628e-1337-4511-a828-51b1cbca934c',NULL,NULL,NULL,NULL,0,1,1,'Reliance Polymers','9890123456','Mumbai, Maharashtra','7qsATVaZo4l2Jrznp8zzuQ==',0,NULL,NULL);
/*!40000 ALTER TABLE `t_crm_vendor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_fin_expense`
--

DROP TABLE IF EXISTS `t_fin_expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_fin_expense` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `expense_id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `category` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `expense_id` (`expense_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_fin_expense`
--

LOCK TABLES `t_fin_expense` WRITE;
/*!40000 ALTER TABLE `t_fin_expense` DISABLE KEYS */;
INSERT INTO `t_fin_expense` VALUES ('4b45c62a-757f-4712-b4ef-7e11d8854df5','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,14,'2026-08-11','Fuel',24500.00,'High-speed diesel for 250 kVA backup generator during load shedding',0,NULL,NULL),('64bfec1e-6c65-4fc9-a033-5d0376257d67','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,15,'2026-08-13','Transport',8200.00,'Local intra-plant forklift battery service & tyre replacement',0,NULL,NULL),('652de2ff-46b5-4c47-9d8c-de1ce3d19d4b',NULL,NULL,NULL,NULL,0,1,2,'2026-08-14','Office',1200.00,'Stationery and printing expenses',0,NULL,NULL),('6b3794c5-4e4e-4d42-8cb3-75aeb48e6ef9','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,13,'2026-08-09','Electricity',142000.00,'MSEDCL Industrial HT Power Bill for Factory Unit 1',0,NULL,NULL),('980bcad5-dae6-4541-ab3e-c47592beae8e','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,17,'2026-08-17','Office',9500.00,'Factory floor safety gear (Helmets, gloves, safety boots for 25 workers)',0,NULL,NULL),('9afd9941-c641-4d73-99d7-848ccf865d94',NULL,NULL,NULL,NULL,0,1,1,'2026-08-12','Maintenance',5500.00,'Monthly machine lubrication and belt replacement',0,NULL,NULL),('c63a94c5-5c81-41b4-929d-4611bc9c04cf','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,16,'2026-08-15','Miscellaneous',12800.00,'Nitrogen cylinder refills and vacuum chamber sensor calibration',0,NULL,NULL),('d586e10d-de98-47aa-bf0a-ffbe255d1a19','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,12,'2026-08-07','Maintenance',18500.00,'Hydraulic oil replacement & filter change for 650T press',0,NULL,NULL);
/*!40000 ALTER TABLE `t_fin_expense` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_fin_invoice`
--

DROP TABLE IF EXISTS `t_fin_invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_fin_invoice` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `invoice_id` int NOT NULL AUTO_INCREMENT,
  `sale_id` char(36) NOT NULL,
  `invoice_no` varchar(255) NOT NULL,
  `created_date` date NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_id` (`invoice_id`),
  KEY `FKfl3ef31ubeqslkth7143ctt3l` (`sale_id`),
  CONSTRAINT `FKfl3ef31ubeqslkth7143ctt3l` FOREIGN KEY (`sale_id`) REFERENCES `t_sal_sales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_fin_invoice`
--

LOCK TABLES `t_fin_invoice` WRITE;
/*!40000 ALTER TABLE `t_fin_invoice` DISABLE KEYS */;
INSERT INTO `t_fin_invoice` VALUES ('0757bbd6-e872-4957-8503-e24227d82fb9','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,86,'bbb2eae6-6344-4ec1-9d4b-330695db2302','INV-2026-105','2026-08-03',0,NULL,NULL),('268dde41-8433-4bea-9854-3f8999fa4489','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,84,'cb1d238b-6332-473b-8bac-5ee1acd5b527','INV-2026-103','2026-08-01',0,NULL,NULL),('3390a5f5-0d37-41ec-82f4-f9a6e409655c','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,91,'0598e4d0-955c-41a8-8b80-862fa06dfade','INV-2026-110','2026-08-08',0,NULL,NULL),('38ab69e7-ba6d-486e-b533-57ef14dbe725','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,90,'f741d9d1-c1f0-46b8-83eb-049cc29fea15','INV-2026-109','2026-08-07',0,NULL,NULL),('4816da2c-a3b9-4b94-ae31-26730d66f169','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,89,'c57f5152-0917-4334-876d-fe09faedbf1d','INV-2026-108','2026-08-06',0,NULL,NULL),('4a47998c-ea0a-458b-86c2-cee920a62fbb','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,96,'a0c14c3d-cdb5-4038-b023-515a6ce48b6f','INV-2026-115','2026-08-13',0,NULL,NULL),('4fa33b32-ba42-456a-90a6-737223892e08','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,93,'5e7d2889-d1f7-4ed5-a306-0cd460b9e3d2','INV-2026-112','2026-08-10',0,NULL,NULL),('5a9c5298-a5e9-4b12-a4c8-58322162580a','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,87,'bb3fbe23-38a3-4d78-b71b-ee353f67b5b5','INV-2026-106','2026-08-04',0,NULL,NULL),('7712f88c-8077-47c4-8c13-4495ee2412a9','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,94,'145c2d19-aaef-44ca-af0e-091899a441f0','INV-2026-113','2026-08-11',0,NULL,NULL),('94d045fb-1080-4f5c-b639-0488d5509c3b','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,88,'17f7efd3-225e-4af1-bf78-9476787eb897','INV-2026-107','2026-08-05',0,NULL,NULL),('9f1a357c-9f85-4b6e-b268-95dc6a3271b9','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,83,'4acac6bc-fccd-43ab-93b9-cd7b4b77974a','INV-2026-102','2026-07-31',0,NULL,NULL),('a6e4790d-9dbd-44d1-8b34-29462cec021c','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,85,'74ba8335-60a8-43bc-b2ef-3d14cc7620e7','INV-2026-104','2026-08-02',0,NULL,NULL),('b2188982-4946-4c62-a07f-c8b2b227bab3','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,82,'6dbc93ae-d760-4104-8e43-f81b2f588b7d','INV-2026-101','2026-07-30',0,NULL,NULL),('c1815d69-e664-4d57-948d-d76c2daa6bbd','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,95,'8a3919ad-0b3a-413e-9911-3408c563ca42','INV-2026-114','2026-08-12',0,NULL,NULL),('c3eefc78-9eda-442d-af77-69c04ffefae8','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,92,'7bb30a92-f09a-409b-b55d-e06cc6e337c2','INV-2026-111','2026-08-09',0,NULL,NULL),('eeceb78d-d8c4-4501-89b4-fc065f367469','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,97,'a3218c12-bced-4f26-a16c-503879e40c0d','INV-2026-116','2026-08-14',0,NULL,NULL),('f8bec534-f128-4d7c-955c-d7c168ee42bf',NULL,NULL,NULL,NULL,0,1,1,'5234b484-d47e-43d3-a243-2cc978524517','INV-SEED-01','2026-08-13',0,NULL,NULL);
/*!40000 ALTER TABLE `t_fin_invoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_fin_payment`
--

DROP TABLE IF EXISTS `t_fin_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_fin_payment` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `party_id` char(36) NOT NULL,
  `invoice_no` varchar(255) DEFAULT NULL,
  `amount_received` decimal(15,2) NOT NULL,
  `payment_mode` varchar(255) NOT NULL,
  `payment_date` date NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_id` (`payment_id`),
  KEY `FKjxt3p8h94kg20ffptnmmlbbsk` (`party_id`),
  CONSTRAINT `FKjxt3p8h94kg20ffptnmmlbbsk` FOREIGN KEY (`party_id`) REFERENCES `t_crm_party` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_fin_payment`
--

LOCK TABLES `t_fin_payment` WRITE;
/*!40000 ALTER TABLE `t_fin_payment` DISABLE KEYS */;
INSERT INTO `t_fin_payment` VALUES ('054f721a-8a86-4658-9fd4-ab0e7ab2d604','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,89,'a54f65f9-b4ae-4b52-be61-de9fa5647654','INV-2026-108',54180.00,'NEFT/RTGS','2026-08-07',0,NULL,NULL),('0c6de208-a26a-4af2-b226-c399e3c68484','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,82,'27b32046-75f4-480d-ba20-4eb1f562cb53','INV-2026-101',21000.00,'UPI','2026-07-31',0,NULL,NULL),('103bb783-91c3-4092-bfbd-fa3c28a0733c','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,97,'4e59c02c-0e74-44c8-95d7-193c1100f30d','INV-2026-116',129000.00,'NEFT/RTGS','2026-08-15',0,NULL,NULL),('169fed0b-935b-4db9-a8db-db9b3f8f9ff7','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,92,'d5039da9-37b6-4343-9b7f-3f7c37ae9549','INV-2026-111',59850.00,'UPI','2026-08-10',0,NULL,NULL),('26244b3e-e0da-468b-9e10-c92025d1f068','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,86,'5de8cf14-b801-4095-a9cd-9f24d2011148','INV-2026-105',26460.00,'UPI','2026-08-04',0,NULL,NULL),('2ddb7953-b933-45dc-9547-f283e98edf09','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,84,'3661a382-8d19-476a-ae9d-9a8c8b1e511e','INV-2026-103',27930.00,'UPI','2026-08-02',0,NULL,NULL),('3a05d217-d377-41c6-a4f1-712ba4f827a8','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,94,'27b32046-75f4-480d-ba20-4eb1f562cb53','INV-2026-113',71400.00,'UPI','2026-08-12',0,NULL,NULL),('56d5f727-9343-47b8-a24b-e801bf99f4f9','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,87,'65e62f79-3410-40a5-9963-e731a117031e','INV-2026-106',34650.00,'NEFT/RTGS','2026-08-05',0,NULL,NULL),('796b0417-3eee-4bfb-a91b-89729eb1a0cb','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,96,'3661a382-8d19-476a-ae9d-9a8c8b1e511e','INV-2026-115',75810.00,'UPI','2026-08-14',0,NULL,NULL),('8a6780dc-9351-41b0-a5dc-3c39dc99f08c','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,93,'e133a43e-a55d-4bfb-855f-c05e1263024c','INV-2026-112',72240.00,'NEFT/RTGS','2026-08-11',0,NULL,NULL),('8df35aaa-edda-4a7d-9bff-74bf5dc912f0','2026-08-19 11:19:18','2026-08-19 11:19:18','ADMIN','ADMIN',0,1,98,'c08c067e-233d-479a-b675-143367d4a036','INV-91',12474.00,'Online (Razorpay / UPI)','2026-08-19',0,NULL,NULL),('9401028e-2ce2-44ff-9adc-32fcca33c19e','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,91,'c08c067e-233d-479a-b675-143367d4a036','INV-2026-110',69300.00,'NEFT/RTGS','2026-08-09',0,NULL,NULL),('a6e41f5c-bb9d-43c4-bc08-fa44e6641a7b','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,90,'af7206bd-e2c7-4a60-98e8-2bda019c6fdf','INV-2026-109',38220.00,'UPI','2026-08-08',0,NULL,NULL),('cae47b56-d70c-4813-ad2b-0776d1c33bab',NULL,NULL,NULL,NULL,0,1,1,'8f201413-4fbf-4bd6-95e0-940d9cdd88c3','INV-SEED-01',8000.00,'UPI','2026-08-13',0,NULL,NULL),('e25ce3cb-2997-4447-919d-b5d65cbdbe78','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,83,'2f5d7b43-9788-43c6-9d2b-1266a3bca6be','INV-2026-102',20790.00,'NEFT/RTGS','2026-08-01',0,NULL,NULL),('e735d550-0965-4955-9c3e-11ad74e8104d','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,88,'8f201413-4fbf-4bd6-95e0-940d9cdd88c3','INV-2026-107',62700.00,'UPI','2026-08-06',0,NULL,NULL),('ee740b9f-fc6e-4e5e-8390-fc17ca02ba08','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,95,'2f5d7b43-9788-43c6-9d2b-1266a3bca6be','INV-2026-114',62370.00,'NEFT/RTGS','2026-08-13',0,NULL,NULL),('f91459ce-733b-46e2-b119-d805fc869f6e','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,85,'4e59c02c-0e74-44c8-95d7-193c1100f30d','INV-2026-104',51600.00,'NEFT/RTGS','2026-08-03',0,NULL,NULL);
/*!40000 ALTER TABLE `t_fin_payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_fin_transaction`
--

DROP TABLE IF EXISTS `t_fin_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_fin_transaction` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `mode` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_fin_transaction`
--

LOCK TABLES `t_fin_transaction` WRITE;
/*!40000 ALTER TABLE `t_fin_transaction` DISABLE KEYS */;
INSERT INTO `t_fin_transaction` VALUES ('09498c4c-be5c-4400-a238-ba652d6de35e','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,5,'2026-08-09','Bank',185000.00,'Payment received from Reliance Fresh Distribution (NEFT)','Credit',0,NULL,NULL),('31a98194-704b-40da-a3e2-dde2bbfed320','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,3,'2026-08-05','Bank',325000.00,'Payment received from Mahindra Agri Solutions Ltd (RTGS)','Credit',0,NULL,NULL),('3b2d104a-81b8-4097-b5e2-ef83aae3a049','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,8,'2026-08-14','UPI',125000.00,'Payment received from Sahyadri Farms Post Harvest Care (UPI QR)','Credit',0,NULL,NULL),('5817c99b-1886-46e0-8659-ec6bcd66c467',NULL,NULL,NULL,NULL,0,1,2,'2026-08-13','Bank',21250.00,'Raw material purchase payment to Reliance Polymers - Ref: NEFT2026060201AB','Debit',0,NULL,NULL),('80b8dc20-5a4e-4166-b1c8-bb17c5064b53','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,9,'2026-08-16','Bank',74000.00,'Vendor payout to Uflex Corrugated Packaging Systems','Debit',0,NULL,NULL),('9e2fc96f-8121-4bd6-becc-446a3ceb9d3a','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,6,'2026-08-10','Bank',92500.00,'Vendor payout to Supreme Polymers Packaging Ltd for HDPE raw material','Debit',0,NULL,NULL),('aca0d964-92ba-4be1-afb7-e58bda53996c','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,10,'2026-08-18','Bank',250000.00,'Payment received from Adani Agri Fresh Logistics (NEFT)','Credit',0,NULL,NULL),('b7502fce-9bc7-452a-8850-87f13e415d46',NULL,NULL,NULL,NULL,0,1,1,'2026-08-10','UPI',50000.00,'Payment received from Ramesh Kumar (UPI) - Ref: UPI2026060101234','Credit',0,NULL,NULL),('f0be8886-3a6a-4de9-9db0-a9e5f679d7e0','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,4,'2026-08-07','UPI',48500.00,'Payment received from Kalyan Agri Traders (UPI Bharat QR)','Credit',0,NULL,NULL),('f6e57aae-ad63-466a-9ff7-e66dd87f8c7c','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,7,'2026-08-12','Bank',142000.00,'MSEDCL Industrial Electricity Bill payment via Netbanking','Debit',0,NULL,NULL);
/*!40000 ALTER TABLE `t_fin_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_hr_driver`
--

DROP TABLE IF EXISTS `t_hr_driver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_hr_driver` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `driver_id` int NOT NULL AUTO_INCREMENT,
  `driver_name` varchar(255) NOT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `license_number` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `driver_id` (`driver_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_hr_driver`
--

LOCK TABLES `t_hr_driver` WRITE;
/*!40000 ALTER TABLE `t_hr_driver` DISABLE KEYS */;
INSERT INTO `t_hr_driver` VALUES ('05144700-9c77-4d33-bd81-f1c40ca9bd43','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,35,'Kashinath Pawar','9766014455','MH-1420180065432','Talegaon, Pune',0,NULL,NULL),('09acf401-7850-4e68-9880-12f7b98025a2',NULL,NULL,NULL,NULL,0,1,1,'Baldev Singh','9922110033','DL-1420230005421','Hadapsar, Pune',0,NULL,NULL),('2e424453-c3b1-4f78-ab79-8dc8431f82b3','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,32,'Baldev Singh Gill','9922110033','DL-1420230005421','Hadapsar, Pune',0,NULL,NULL),('567c7129-a449-4278-882a-7d6e4e06eb83','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,34,'Sukhwinder Sandhu','9888012345','PB-1020210098765','Nigdi, Pune',0,NULL,NULL),('656dc099-eda9-402f-9d97-cefeec149491','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,36,'Prakash Jadhav','9822998877','MH-1520200033221','Nashik Road, Nashik',0,NULL,NULL),('9630d46a-4a89-4607-9428-304fa7616817','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,33,'Rameshwar Shinde','9850123456','MH-1220190041234','Baramati, Pune',0,NULL,NULL),('ed02b4f3-2165-40b4-93a5-aa5f68be289a','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,37,'Gurpreet Singh','9914055667','HR-0520220088990','Vashi, Navi Mumbai',0,NULL,NULL);
/*!40000 ALTER TABLE `t_hr_driver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_hr_employee`
--

DROP TABLE IF EXISTS `t_hr_employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_hr_employee` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `emp_id` int NOT NULL AUTO_INCREMENT,
  `emp_name` varchar(255) NOT NULL,
  `emp_contact` varchar(255) NOT NULL,
  `salary` decimal(15,2) NOT NULL,
  `address` varchar(255) NOT NULL,
  `designation` varchar(255) NOT NULL,
  `joining_date` date NOT NULL,
  `aadhaar_no` varchar(255) NOT NULL,
  `bank_account` varchar(255) NOT NULL,
  `photo_path` varchar(255) NOT NULL,
  `aadhaar_card_path` varchar(255) NOT NULL,
  `bank_passbook_path` varchar(255) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `emp_id` (`emp_id`),
  UNIQUE KEY `UKg096anx0sc058xrwuub8unk8a` (`emp_name`),
  UNIQUE KEY `UKeffubu1xr4xxapp9h1e8f9ot0` (`emp_contact`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_hr_employee`
--

LOCK TABLES `t_hr_employee` WRITE;
/*!40000 ALTER TABLE `t_hr_employee` DISABLE KEYS */;
INSERT INTO `t_hr_employee` VALUES ('44ae6b82-1a96-4364-b826-d9d2f6d90766','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,48,'Dipak Wagh','9821077889',22000.00,'Chinchwad, Pune','Inventory Storekeeper','2024-05-01','234567890123','P44r1nMSrAcYq3mf5N38koPBCgQCi5QB5NaRmL3MDrU=','assets/avatars/default.png','uploads/aadhaar_2345.pdf','uploads/passbook_PUNB0002345.pdf',0,NULL,NULL,NULL),('4de110bf-b981-45b5-b201-528be38930c0','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,43,'Mahesh Gaikwad','9850022334',28000.00,'Hadapsar, Pune','Machine Operator - Line 1','2023-08-15','567890123456','kh2SK8Y8EneacUtZStJh88uN/3FQyPMYTDND+HRf0VE=','assets/avatars/default.png','uploads/aadhaar_5678.pdf','uploads/passbook_ICIC0005678.pdf',0,NULL,NULL,NULL),('600ba00f-20ea-4048-b1c7-57f17eade62b','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,47,'Tanaji Bhosale','9422066778',24000.00,'Talegaon, Pune','Dispatch & Logistics Supervisor','2024-03-05','901234567890','qyi7aVMW1BzQAGQlB/kBQWTWKFJODvtwWI10qpav2GI=','assets/avatars/default.png','uploads/aadhaar_9012.pdf','uploads/passbook_BARB0009012.pdf',0,NULL,NULL,NULL),('6e8a637f-15a1-4aa6-bf7d-2ca99903e5ae','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,45,'Priyanka Kulkarni','9890044556',38000.00,'Wakad, Pune','Senior Accountant','2023-06-01','789012345678','e0wn06EmsriKuHaS50lsdlaNF8pVWUhP+vUpImPhu/I=','assets/avatars/default.png','uploads/aadhaar_7890.pdf','uploads/passbook_UTIB0007890.pdf',0,NULL,NULL,NULL),('b5c232c3-ce50-4474-9fa9-63def4fc5186',NULL,NULL,NULL,NULL,0,1,1,'Amit Patel','9823456789',25000.00,'Pune, Maharashtra','Operator','2025-01-15','123456789012','52MaHLxKR/gfJgwEizJakQ==','dummy_photo.jpg','dummy_aadhaar.pdf','dummy_passbook.pdf',0,NULL,NULL,NULL),('d38bd29f-2ff5-4ad0-be8f-e54a23b235db','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,44,'Sunil More','9766033445',26000.00,'Chakan, Pune','Machine Operator - Line 2','2024-01-10','678901234567','t9pXB+OyHfJ40UWRhFDc3Do/EvUXwI0CkubBeKaWgkQ=','assets/avatars/default.png','uploads/aadhaar_6789.pdf','uploads/passbook_SBIN0006789.pdf',0,NULL,NULL,NULL),('d85a737f-bba7-439b-b5ae-c1d18b2b7aa5','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,49,'Snehal Joshi','9860088990',35000.00,'Aundh, Pune','HR & Admin Officer','2023-09-12','345678901234','AIi1pX50pbGptbE3LtkrPFSR5NSK92nQh+Q6rkxL2PY=','assets/avatars/default.png','uploads/aadhaar_3456.pdf','uploads/passbook_MAHB0003456.pdf',0,NULL,NULL,NULL),('eab2fc90-e062-4f14-97d3-af5d0e279239','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,46,'Aniket Shinde','9922055667',32000.00,'Bhosari, Pune','Quality Assurance Lead','2023-11-20','890123456789','YElhcUgnvhWjfXh1xdKNVkNby9VoyPjNPjMVQjhjWaU=','assets/avatars/default.png','uploads/aadhaar_8901.pdf','uploads/passbook_KKBK0008901.pdf',0,NULL,NULL,NULL),('f096eb7f-acf9-407f-a630-d8fb5bbb2b7d','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,42,'Sachin Deshmukh','9823011223',45000.00,'Kothrud, Pune','Production Manager','2023-04-01','458912345678','0gzOr7OqmiBOMuKT1NhHL0zRpxKBa9OBJHkUnKagAKY=','assets/avatars/default.png','uploads/aadhaar_4589.pdf','uploads/passbook_HDFC0001234.pdf',0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `t_hr_employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_hr_salary`
--

DROP TABLE IF EXISTS `t_hr_salary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_hr_salary` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `salary_id` int NOT NULL AUTO_INCREMENT,
  `emp_id` char(36) NOT NULL,
  `month` varchar(255) NOT NULL,
  `year` int NOT NULL,
  `salary_amount` decimal(15,2) NOT NULL,
  `paid_date` date DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `salary_id` (`salary_id`),
  KEY `FKet05nqofh2um1jqx7jule0orq` (`emp_id`),
  CONSTRAINT `FKet05nqofh2um1jqx7jule0orq` FOREIGN KEY (`emp_id`) REFERENCES `t_hr_employee` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_hr_salary`
--

LOCK TABLES `t_hr_salary` WRITE;
/*!40000 ALTER TABLE `t_hr_salary` DISABLE KEYS */;
INSERT INTO `t_hr_salary` VALUES ('25666d74-147a-423d-9284-cecead339ae5','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,93,'600ba00f-20ea-4048-b1c7-57f17eade62b','AUGUST',2026,24000.00,NULL,'Pending',0,NULL,NULL),('30915d6e-9943-49d9-96e2-9b976ceaa16e','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,88,'6e8a637f-15a1-4aa6-bf7d-2ca99903e5ae','JULY',2026,38000.00,'2026-08-05','Paid',0,NULL,NULL),('6ad8b6f1-6349-4af6-ad6a-c170daabb1da','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,90,'eab2fc90-e062-4f14-97d3-af5d0e279239','JULY',2026,32000.00,'2026-08-05','Paid',0,NULL,NULL),('993095c3-aa47-44dc-88ba-e56300cb8090',NULL,NULL,NULL,NULL,0,1,1,'b5c232c3-ce50-4474-9fa9-63def4fc5186','MAY',2026,25000.00,'2026-08-10','Paid',0,NULL,NULL),('9fc09037-abfb-48f5-88a1-cf22ef6e2497','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,82,'f096eb7f-acf9-407f-a630-d8fb5bbb2b7d','JULY',2026,45000.00,'2026-08-05','Paid',0,NULL,NULL),('b4e5df4d-132b-4f53-a51e-b43675e9b0e0','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,95,'44ae6b82-1a96-4364-b826-d9d2f6d90766','AUGUST',2026,22000.00,NULL,'Pending',0,NULL,NULL),('b532af98-545d-4d24-ab79-872f2bf43763','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,83,'f096eb7f-acf9-407f-a630-d8fb5bbb2b7d','AUGUST',2026,45000.00,NULL,'Pending',0,NULL,NULL),('c406e188-3700-412d-b7e3-0eead590bb47','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,91,'eab2fc90-e062-4f14-97d3-af5d0e279239','AUGUST',2026,32000.00,NULL,'Pending',0,NULL,NULL),('cf07d931-2988-4dbb-b968-3db6d3e6bf2d','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,96,'d85a737f-bba7-439b-b5ae-c1d18b2b7aa5','JULY',2026,35000.00,'2026-08-05','Paid',0,NULL,NULL),('d3f8e958-6081-4f47-94dd-cb662752c3c7','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,97,'d85a737f-bba7-439b-b5ae-c1d18b2b7aa5','AUGUST',2026,35000.00,NULL,'Pending',0,NULL,NULL),('da382ae8-5be8-4306-89b5-378c432b966a','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,89,'6e8a637f-15a1-4aa6-bf7d-2ca99903e5ae','AUGUST',2026,38000.00,NULL,'Pending',0,NULL,NULL),('dafe69f4-57e7-417c-b59b-9fbf385ddc21','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,84,'4de110bf-b981-45b5-b201-528be38930c0','JULY',2026,28000.00,'2026-08-05','Paid',0,NULL,NULL),('db3761c6-0f81-4b94-9644-05cd209e3fce','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,94,'44ae6b82-1a96-4364-b826-d9d2f6d90766','JULY',2026,22000.00,'2026-08-05','Paid',0,NULL,NULL),('dfadc70b-0844-43b9-8792-ad2b300c6914','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,92,'600ba00f-20ea-4048-b1c7-57f17eade62b','JULY',2026,24000.00,'2026-08-05','Paid',0,NULL,NULL),('dfcbbf44-54f3-4799-a47a-4a9c8433b1a6','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,85,'4de110bf-b981-45b5-b201-528be38930c0','AUGUST',2026,28000.00,NULL,'Pending',0,NULL,NULL),('ea125b47-5ca9-4263-8bb0-b0275292217e','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,87,'d38bd29f-2ff5-4ad0-be8f-e54a23b235db','AUGUST',2026,26000.00,NULL,'Pending',0,NULL,NULL),('ead40b0e-3d64-4005-a532-1638bb0c4807','2026-08-19 10:26:09','2026-08-19 10:26:09','system','system',0,1,86,'d38bd29f-2ff5-4ad0-be8f-e54a23b235db','JULY',2026,26000.00,'2026-08-05','Paid',0,NULL,NULL);
/*!40000 ALTER TABLE `t_hr_salary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_inv_inventory`
--

DROP TABLE IF EXISTS `t_inv_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_inv_inventory` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `inventory_id` int NOT NULL AUTO_INCREMENT,
  `crate_type` varchar(255) NOT NULL,
  `material_type` varchar(255) NOT NULL,
  `opening_stock` int NOT NULL,
  `produced_stock` int NOT NULL,
  `sold_stock` int NOT NULL,
  `current_stock` int NOT NULL,
  `last_updated` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_id` (`inventory_id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_inv_inventory`
--

LOCK TABLES `t_inv_inventory` WRITE;
/*!40000 ALTER TABLE `t_inv_inventory` DISABLE KEYS */;
INSERT INTO `t_inv_inventory` VALUES ('199f735e-a25f-4c91-9e9a-1bb8075e9713','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,34,'Pomegranate Super-Red Crate (5kg)','Ventilated Plastic',6200,9800,7400,8600,'2026-08-19 10:26:10',0,NULL,NULL),('698e0dc5-b71b-4ad6-ae84-bbdb7a178171','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,35,'Kesar Mango Export Box (10kg)','Corrugated Solid Board',4500,7200,5800,5900,'2026-08-19 10:26:10',0,NULL,NULL),('9fbeab83-2c16-47fe-84a6-8fc29acdb174','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,33,'Export Grade A Grapes Crate','Food-Grade Plastic',8500,14200,11500,11200,'2026-08-19 10:26:10',0,NULL,NULL),('a9010b0e-7531-4463-a603-4650d20fd9c5',NULL,NULL,NULL,NULL,0,1,2,'Tomato Tray','Plastic',2500,0,0,2500,'2026-08-15 06:33:09',0,NULL,NULL),('c0743dd0-4703-43d7-99f0-97f83486c8d6','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,36,'Fresh Tomato Commercial Tray','Heavy-Duty HDPE',9000,18500,15200,12300,'2026-08-19 10:26:10',0,NULL,NULL),('da2d4638-43a1-4abf-b5d8-28448c626205',NULL,NULL,NULL,NULL,2,1,1,'Apple Crate','Plastic',5000,2480,100,7380,'2026-08-15 06:33:09',0,NULL,NULL),('e3e323d6-1ead-44b4-bd2c-838bb60585cd','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,38,'Capsicum & Exotic Veg Box','Biodegradable Board',2800,4900,3600,4100,'2026-08-19 10:26:10',0,NULL,NULL),('ee35591b-dd31-434d-a784-094950a98fe4','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,37,'Citrus / Orange Storage Crate','Plastic Perforated',3500,6000,4100,5400,'2026-08-19 10:26:10',0,NULL,NULL);
/*!40000 ALTER TABLE `t_inv_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_inv_raw_material`
--

DROP TABLE IF EXISTS `t_inv_raw_material`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_inv_raw_material` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `raw_material_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` char(36) NOT NULL,
  `date` date NOT NULL,
  `material_name` varchar(255) NOT NULL,
  `weight` decimal(15,2) NOT NULL,
  `rate` decimal(15,2) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `purchase_bill_path` varchar(255) DEFAULT NULL,
  `weight_slip_path` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `raw_material_id` (`raw_material_id`),
  KEY `FK8ts48ksuuod60qjrh2jdlbcys` (`vendor_id`),
  CONSTRAINT `FK8ts48ksuuod60qjrh2jdlbcys` FOREIGN KEY (`vendor_id`) REFERENCES `t_crm_vendor` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_inv_raw_material`
--

LOCK TABLES `t_inv_raw_material` WRITE;
/*!40000 ALTER TABLE `t_inv_raw_material` DISABLE KEYS */;
INSERT INTO `t_inv_raw_material` VALUES ('504e2ea2-8d62-488c-a8d1-68ddc38b2565','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,34,'5bf2f118-f1ba-4a35-bae2-b2a2ff7f18ac','2026-08-05','Recycled Polyethylene Compound',6500.00,64.00,416000.00,NULL,NULL,0,NULL,NULL),('7eb3e569-377a-40b9-8445-06e5eb438147','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,32,'1ce3c56f-9e91-4285-9368-14194a38b177','2026-08-01','Virgin HDPE Granules Grade 100',5000.00,92.50,462500.00,NULL,NULL,0,NULL,NULL),('88cd62a4-3087-41b3-99b2-2fdc47a6245a','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,37,'cc5af39f-476c-46b3-b0fc-65c414dca928','2026-08-11','Corrugated 5-Ply Outer Carton Sheets',3500.00,45.00,157500.00,NULL,NULL,0,NULL,NULL),('8a3b7566-ede7-4645-aec7-95e44838d046','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,33,'4b27033a-c62f-4139-be0c-b7c40b3d4918','2026-08-03','Food-Grade PP Granules (Impact Copolymer)',4200.00,88.00,369600.00,NULL,NULL,0,NULL,NULL),('cf10f108-8ffc-456a-9250-33b39c22f2d9','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,36,'c35252e6-462b-434a-8452-086670b7b63f','2026-08-09','Blue/Red Colour Masterbatch Pigment',600.00,185.00,111000.00,NULL,NULL,0,NULL,NULL),('da9bebfd-ce4c-419a-b9f4-50abc48f2c24',NULL,NULL,NULL,NULL,0,1,1,'f53a628e-1337-4511-a828-51b1cbca934c','2026-08-15','HDPE Plastic Granules',2500.00,85.00,212500.00,NULL,NULL,0,NULL,NULL),('fca70ace-3b39-45da-a5f6-765218a2ee83','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,35,'79a534ec-9a72-4ec2-87b4-2e24746d47c7','2026-08-07','UV Stabilizer Masterbatch (Agro Grade)',800.00,240.00,192000.00,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `t_inv_raw_material` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_log_dispatch`
--

DROP TABLE IF EXISTS `t_log_dispatch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_log_dispatch` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `dispatch_id` int NOT NULL AUTO_INCREMENT,
  `dispatch_number` varchar(255) NOT NULL,
  `sale_id` char(36) NOT NULL,
  `vehicle_number` varchar(255) NOT NULL,
  `driver_name` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `status` varchar(255) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dispatch_id` (`dispatch_id`),
  KEY `FK8wa97kkbwfbyidi44bedk4al3` (`sale_id`),
  CONSTRAINT `FK8wa97kkbwfbyidi44bedk4al3` FOREIGN KEY (`sale_id`) REFERENCES `t_sal_sales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1011 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_log_dispatch`
--

LOCK TABLES `t_log_dispatch` WRITE;
/*!40000 ALTER TABLE `t_log_dispatch` DISABLE KEYS */;
INSERT INTO `t_log_dispatch` VALUES ('3ef27ddc-6ffc-42a5-add2-f2cf14b1126f','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,1008,'DSP-2026-1008','74ba8335-60a8-43bc-b2ef-3d14cc7620e7','MH-15-AG-9900','Kashinath Pawar','2026-08-14','Pending',0,NULL,NULL),('5d778334-f8da-447f-98c1-a75a0ec3a2d4','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,1006,'DSP-2026-1006','5e7d2889-d1f7-4ed5-a306-0cd460b9e3d2','MH-12-FC-7890','Rameshwar Shinde','2026-08-12','In Transit',0,NULL,NULL),('616f9e9b-696c-4290-9edf-e393ad26eed0','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,1009,'DSP-2026-1009','7bb30a92-f09a-409b-b55d-e06cc6e337c2','MH-12-RN-4589','Baldev Singh','2026-08-15','Delivered',0,NULL,NULL),('6a6445cb-f65c-4a78-a36c-b225fb61a32f','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,1010,'DSP-2026-1010','8a3919ad-0b3a-413e-9911-3408c563ca42','MH-12-FC-7890','Baldev Singh Gill','2026-08-16','In Transit',0,NULL,NULL),('9bf81b5a-271c-4194-812d-939fc570132a','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,1001,'DSP-2026-1001','0598e4d0-955c-41a8-8b80-862fa06dfade','MH-12-RN-4589','Kashinath Pawar','2026-08-07','Delivered',0,NULL,NULL),('ad1d5c6a-4823-4456-a529-044ee3d4065c','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,1004,'DSP-2026-1004','4acac6bc-fccd-43ab-93b9-cd7b4b77974a','MH-15-AG-9900','Sukhwinder Sandhu','2026-08-10','Pending',0,NULL,NULL),('b3d5abcf-ee54-4705-8006-258e243a2820','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,1007,'DSP-2026-1007','6dbc93ae-d760-4104-8e43-f81b2f588b7d','MH-14-BT-1122','Gurpreet Singh','2026-08-13','Delivered',0,NULL,NULL),('b925402a-0ec1-4b09-bf5b-42861b07043c','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,1003,'DSP-2026-1003','17f7efd3-225e-4af1-bf78-9476787eb897','MH-14-BT-1122','Baldev Singh Gill','2026-08-09','Delivered',0,NULL,NULL),('cc94de1b-6ee0-4093-98c4-071aa7f3b54d','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,1002,'DSP-2026-1002','145c2d19-aaef-44ca-af0e-091899a441f0','MH-12-FC-7890','Baldev Singh','2026-08-08','In Transit',0,NULL,NULL),('d63edcdd-9523-4a85-99b1-4fa96b63ac98','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,1005,'DSP-2026-1005','5234b484-d47e-43d3-a243-2cc978524517','MH-12-RN-4589','Prakash Jadhav','2026-08-11','Delivered',0,NULL,NULL);
/*!40000 ALTER TABLE `t_log_dispatch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_log_transport`
--

DROP TABLE IF EXISTS `t_log_transport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_log_transport` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `transport_id` int NOT NULL AUTO_INCREMENT,
  `driver_id` char(36) NOT NULL,
  `date` date NOT NULL,
  `truck_number` varchar(255) NOT NULL,
  `rent` decimal(15,2) NOT NULL,
  `advance` decimal(15,2) NOT NULL,
  `remaining` decimal(15,2) NOT NULL,
  `truck_photo_path` varchar(255) DEFAULT NULL,
  `driver_license_path` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transport_id` (`transport_id`),
  KEY `FKsedoihln5ag677iaxtt67wgyy` (`driver_id`),
  CONSTRAINT `FKsedoihln5ag677iaxtt67wgyy` FOREIGN KEY (`driver_id`) REFERENCES `t_hr_driver` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_log_transport`
--

LOCK TABLES `t_log_transport` WRITE;
/*!40000 ALTER TABLE `t_log_transport` DISABLE KEYS */;
INSERT INTO `t_log_transport` VALUES ('588d52f6-06e2-4adb-a566-fa74882399d2','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,26,'05144700-9c77-4d33-bd81-f1c40ca9bd43','2026-08-04','MH-12-RN-4589',8500.00,3000.00,5500.00,NULL,NULL,0,NULL,NULL),('5da288c4-cb02-4a4d-a924-26ad2aae2566','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,27,'09acf401-7850-4e68-9880-12f7b98025a2','2026-08-05','MH-12-FC-7890',9000.00,3200.00,5800.00,NULL,NULL,0,NULL,NULL),('704f7974-3593-42e1-ad14-056c28d543a3','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,29,'567c7129-a449-4278-882a-7d6e4e06eb83','2026-08-07','MH-15-AG-9900',10000.00,3600.00,6400.00,NULL,NULL,0,NULL,NULL),('72a0c0e8-ceb2-445e-968f-c5766381dc9d','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,31,'9630d46a-4a89-4607-9428-304fa7616817','2026-08-09','MH-12-RN-4589',11000.00,4000.00,7000.00,NULL,NULL,0,NULL,NULL),('7bfcc13c-d6e7-41b8-ac17-a921bcae96a3','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,28,'2e424453-c3b1-4f78-ab79-8dc8431f82b3','2026-08-06','MH-14-BT-1122',9500.00,3400.00,6100.00,NULL,NULL,0,NULL,NULL),('aea371df-6d06-4e42-ac6e-8d7a836185d9','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,30,'656dc099-eda9-402f-9d97-cefeec149491','2026-08-08','MH-04-KD-3344',10500.00,3800.00,6700.00,NULL,NULL,0,NULL,NULL),('bfb8dccf-daf4-4026-8069-b8ead27f5dc5','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,33,'05144700-9c77-4d33-bd81-f1c40ca9bd43','2026-08-11','MH-14-BT-1122',12000.00,4400.00,7600.00,NULL,NULL,0,NULL,NULL),('e9f4b2b4-f09e-493d-b6bc-6552943b73e8','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,32,'ed02b4f3-2165-40b4-93a5-aa5f68be289a','2026-08-10','MH-12-FC-7890',11500.00,4200.00,7300.00,NULL,NULL,0,NULL,NULL),('ebfac549-95c9-48b5-bb8d-b95d30db5227',NULL,NULL,NULL,NULL,0,1,1,'09acf401-7850-4e68-9880-12f7b98025a2','2026-08-15','MH-12-AB-1234',8500.00,3000.00,5500.00,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `t_log_transport` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_pay_payment_links`
--

DROP TABLE IF EXISTS `t_pay_payment_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_pay_payment_links` (
  `id` char(36) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `razorpay_payment_id` varchar(100) DEFAULT NULL,
  `razorpay_payment_link_id` varchar(100) NOT NULL,
  `sale_id` char(36) NOT NULL,
  `short_url` varchar(500) NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `whatsapp_message` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_fxig0my0xxlif5ipf5gsg9m1m` (`razorpay_payment_link_id`),
  UNIQUE KEY `UK_dv1af9n7n2qsujmqwa5lcsr6b` (`razorpay_payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_pay_payment_links`
--

LOCK TABLES `t_pay_payment_links` WRITE;
/*!40000 ALTER TABLE `t_pay_payment_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_pay_payment_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_prd_breakdown`
--

DROP TABLE IF EXISTS `t_prd_breakdown`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_prd_breakdown` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `breakdown_id` int NOT NULL AUTO_INCREMENT,
  `machine_id` char(36) NOT NULL,
  `date` date NOT NULL,
  `issue` varchar(255) NOT NULL,
  `resolved_by` varchar(255) DEFAULT NULL,
  `downtime` int DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `breakdown_id` (`breakdown_id`),
  KEY `FKeda1dnioqwljw7f6ida3i5aus` (`machine_id`),
  CONSTRAINT `FKeda1dnioqwljw7f6ida3i5aus` FOREIGN KEY (`machine_id`) REFERENCES `t_prd_machine_master` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_prd_breakdown`
--

LOCK TABLES `t_prd_breakdown` WRITE;
/*!40000 ALTER TABLE `t_prd_breakdown` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_prd_breakdown` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_prd_machine_master`
--

DROP TABLE IF EXISTS `t_prd_machine_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_prd_machine_master` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `machine_id` int NOT NULL AUTO_INCREMENT,
  `machine_name` varchar(255) NOT NULL,
  `manufacturer` varchar(255) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `warranty_date` date DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `machine_id` (`machine_id`),
  UNIQUE KEY `UK2dkb7mt30l13kk1jafwfwjb9a` (`machine_name`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_prd_machine_master`
--

LOCK TABLES `t_prd_machine_master` WRITE;
/*!40000 ALTER TABLE `t_prd_machine_master` DISABLE KEYS */;
INSERT INTO `t_prd_machine_master` VALUES ('0a1061f6-272c-4dff-9670-ab2ba4dcf60c','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,26,'Diesel Backup Generator (250 kVA)','Cummins Power Systems','2022-08-01','2027-08-01','Running',0,NULL,NULL),('3072502d-fc55-44f0-988d-d4e92fee5e31',NULL,NULL,NULL,NULL,0,1,2,'Injection Moulding Machine 2','IMM-002','2024-01-10','2026-01-10','Running',0,NULL,NULL),('3a7d9011-c32f-405e-9fb4-467b3f783a5f','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,23,'Automated Optical Fruit Sorting & Grading Line','Compac Sorting Equipment','2023-06-10','2026-06-10','Running',0,NULL,NULL),('86f24c20-8fcc-4199-91c5-9e90a828278e','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,24,'Cold Chamber Ammonia Chilling Compressor #1','Kirloskar Chillers','2021-11-05','2026-11-05','Running',0,NULL,NULL),('91137f32-cb67-4068-b49d-711ff1a4b980','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,22,'Heavy-Duty Agro Crate Moulding Press 2 (650T)','Toshiba Machine India','2023-01-20','2028-01-20','Running',0,NULL,NULL),('9c3d6f86-3b73-484e-b3e7-50c3d72a1a90','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,25,'Automatic Box Strapping & Stretch Wrapping Unit','Signode Packaging','2024-02-18','2027-02-18','Running',0,NULL,NULL),('b6385f84-5c2c-4635-9cd6-4b61ac5df0e6','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,21,'High-Speed Injection Moulding Press 1 (450T)','Windsor Machines India','2022-03-15','2027-03-15','Running',0,NULL,NULL),('c0abd8a4-e27a-47d0-9ceb-17520f3c4b26',NULL,NULL,NULL,NULL,0,1,1,'Injection Moulding Machine 1','IMM-001','2023-06-01','2025-06-01','Running',0,NULL,NULL);
/*!40000 ALTER TABLE `t_prd_machine_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_prd_ppd`
--

DROP TABLE IF EXISTS `t_prd_ppd`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_prd_ppd` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `ppd_id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `crate_type` varchar(255) NOT NULL,
  `total_production` int NOT NULL,
  `successful` int NOT NULL,
  `rejected` int NOT NULL,
  `shift` varchar(255) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ppd_id` (`ppd_id`)
) ENGINE=InnoDB AUTO_INCREMENT=362 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_prd_ppd`
--

LOCK TABLES `t_prd_ppd` WRITE;
/*!40000 ALTER TABLE `t_prd_ppd` DISABLE KEYS */;
INSERT INTO `t_prd_ppd` VALUES ('022dffbb-8556-47b4-a9d4-5f8b91d1f9d3','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,353,'2026-08-16','Fresh Tomato Commercial Tray',1353,1333,20,'Morning Shift',0,NULL,NULL),('039224f3-3baa-428b-bbc7-f00e8970cf94','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,309,'2026-08-05','Fresh Tomato Commercial Tray',1833,1806,27,'Morning Shift',0,NULL,NULL),('077a43e6-2a14-4c2e-a31c-8fca7791dd0f','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,311,'2026-08-06','Pomegranate Super-Red Crate (5kg)',1670,1645,25,'Morning Shift',0,NULL,NULL),('08970f96-0055-429b-b2fb-27bd0042a911','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,342,'2026-08-14','Export Grade A Grapes Crate',1485,1463,22,'Morning Shift',0,NULL,NULL),('0b3de89d-336a-4853-b4a5-47de7a218ac8','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,314,'2026-08-07','Export Grade A Grapes Crate',1623,1599,24,'Morning Shift',0,NULL,NULL),('0e215703-3b30-4597-896f-3293018aac06','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,351,'2026-08-16','Pomegranate Super-Red Crate (5kg)',1350,1330,20,'Morning Shift',0,NULL,NULL),('0e75ce5c-e141-408e-987f-a6d5e23d0326','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,328,'2026-08-10','Kesar Mango Export Box (10kg)',1644,1620,24,'Morning Shift',0,NULL,NULL),('10a41dc7-e607-414b-804d-fb72e140d25b','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,354,'2026-08-17','Export Grade A Grapes Crate',1396,1376,20,'Morning Shift',0,NULL,NULL),('1525974b-8939-4080-a729-be6be1be477e','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,337,'2026-08-12','Fresh Tomato Commercial Tray',1582,1559,23,'Morning Shift',0,NULL,NULL),('17159f1c-600a-4d31-9625-137c6e8e5018','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,318,'2026-08-08','Export Grade A Grapes Crate',1662,1638,24,'Morning Shift',0,NULL,NULL),('1bcdd6f0-fe16-4175-a0a1-1376cb867ecf','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,308,'2026-08-05','Kesar Mango Export Box (10kg)',1726,1701,25,'Morning Shift',0,NULL,NULL),('23abd27a-403e-4646-8147-45a58cdcb679','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,327,'2026-08-10','Pomegranate Super-Red Crate (5kg)',1708,1683,25,'Morning Shift',0,NULL,NULL),('26ff69be-010c-446b-988c-7574919e87de','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,329,'2026-08-10','Fresh Tomato Commercial Tray',1701,1676,25,'Morning Shift',0,NULL,NULL),('2b939b97-0604-4da7-861f-fb1b9e971ede','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,324,'2026-08-09','Kesar Mango Export Box (10kg)',1677,1652,25,'Morning Shift',0,NULL,NULL),('36d41151-d0b6-4f77-8f80-f9ed07bb2525','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,352,'2026-08-16','Kesar Mango Export Box (10kg)',1399,1379,20,'Morning Shift',0,NULL,NULL),('38bac982-4534-4924-890c-ad66f9a76911','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,343,'2026-08-14','Pomegranate Super-Red Crate (5kg)',1404,1383,21,'Morning Shift',0,NULL,NULL),('3a93ebba-7c73-4904-b75b-456258b95513','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,325,'2026-08-09','Fresh Tomato Commercial Tray',1659,1635,24,'Morning Shift',0,NULL,NULL),('3cf74664-a9de-496a-9a46-7b8d6f469c2b','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,349,'2026-08-15','Fresh Tomato Commercial Tray',1352,1332,20,'Morning Shift',0,NULL,NULL),('4c064de5-b82f-44ec-89e4-288110e00f29','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,312,'2026-08-06','Kesar Mango Export Box (10kg)',1788,1762,26,'Morning Shift',0,NULL,NULL),('4d2bcba9-c389-4cde-b4ae-64eb16b43213','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,326,'2026-08-10','Export Grade A Grapes Crate',1593,1570,23,'Morning Shift',0,NULL,NULL),('4eea31a8-3d5f-41cf-a1d8-7bb7e3aecd42','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,338,'2026-08-13','Export Grade A Grapes Crate',1504,1482,22,'Morning Shift',0,NULL,NULL),('5aa15103-13c5-4db1-9940-9e12dde3ccae','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,333,'2026-08-11','Fresh Tomato Commercial Tray',1523,1501,22,'Morning Shift',0,NULL,NULL),('5bc43aaf-c2ab-43ae-8178-c4d0427b213f','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,357,'2026-08-17','Fresh Tomato Commercial Tray',1375,1355,20,'Morning Shift',0,NULL,NULL),('5bd8f31f-43a4-4ecb-994d-8bd2b766e5e1','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,341,'2026-08-13','Fresh Tomato Commercial Tray',1518,1496,22,'Morning Shift',0,NULL,NULL),('6102ffc3-49d1-4476-9b9a-876b7b90c5ce','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,321,'2026-08-08','Fresh Tomato Commercial Tray',1653,1629,24,'Morning Shift',0,NULL,NULL),('6796510d-92a2-449c-a77d-fb48b0c4f89f','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,322,'2026-08-09','Export Grade A Grapes Crate',1704,1679,25,'Morning Shift',0,NULL,NULL),('688c9c68-0b79-4acf-aff9-86a5d6b94485','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,316,'2026-08-07','Kesar Mango Export Box (10kg)',1780,1754,26,'Morning Shift',0,NULL,NULL),('6ca9637e-5b6c-42ce-a6d8-a66f5cf0f951','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,358,'2026-08-18','Export Grade A Grapes Crate',1247,1229,18,'Morning Shift',0,NULL,NULL),('73ffa279-d684-4b15-bddc-c93eea7a8ed9','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,360,'2026-08-18','Kesar Mango Export Box (10kg)',1305,1286,19,'Morning Shift',0,NULL,NULL),('767aadc9-0bbe-4a81-89c7-720c0bf9e112','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,336,'2026-08-12','Kesar Mango Export Box (10kg)',1510,1488,22,'Morning Shift',0,NULL,NULL),('78e8fc3a-4061-4fc1-ba1d-c58ee5c63483','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,306,'2026-08-05','Export Grade A Grapes Crate',1820,1793,27,'Morning Shift',0,NULL,NULL),('79426e2a-ce34-471c-bd06-f2589ddcc83d','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,350,'2026-08-16','Export Grade A Grapes Crate',1390,1370,20,'Morning Shift',0,NULL,NULL),('7d4edf8d-8186-4050-8697-c5b5ff196007','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,320,'2026-08-08','Kesar Mango Export Box (10kg)',1757,1731,26,'Morning Shift',0,NULL,NULL),('7df33aea-9721-4718-9ae9-e2a925e6b260','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,313,'2026-08-06','Fresh Tomato Commercial Tray',1853,1826,27,'Morning Shift',0,NULL,NULL),('7e2df37a-cef4-4e94-8012-047dbec31249','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,346,'2026-08-15','Export Grade A Grapes Crate',1367,1347,20,'Morning Shift',0,NULL,NULL),('818e8c92-b835-4f76-b3c3-245850abc468','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,347,'2026-08-15','Pomegranate Super-Red Crate (5kg)',1460,1439,21,'Morning Shift',0,NULL,NULL),('86332fa1-fb3a-45a5-84ef-37159686c00b','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,303,'2026-08-04','Pomegranate Super-Red Crate (5kg)',1920,1892,28,'Morning Shift',0,NULL,NULL),('87f71a9f-c584-4740-ba35-ee71123edf3f','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,348,'2026-08-15','Kesar Mango Export Box (10kg)',1344,1324,20,'Morning Shift',0,NULL,NULL),('8ace2b87-8a04-43f8-893a-ad3da232edd0','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,317,'2026-08-07','Fresh Tomato Commercial Tray',1794,1768,26,'Morning Shift',0,NULL,NULL),('8b3afa36-8290-49b4-a21a-066bd5562abe','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,332,'2026-08-11','Kesar Mango Export Box (10kg)',1558,1535,23,'Morning Shift',0,NULL,NULL),('8fd886cb-fda6-4010-b3f3-f43115e49a65','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,361,'2026-08-18','Fresh Tomato Commercial Tray',1310,1291,19,'Morning Shift',0,NULL,NULL),('96048c18-1898-4f96-b669-6562baa90e91','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,304,'2026-08-04','Kesar Mango Export Box (10kg)',1799,1773,26,'Morning Shift',0,NULL,NULL),('a6a2b3e8-ef14-455c-90f1-805c0c1f9cb3','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,310,'2026-08-06','Export Grade A Grapes Crate',1742,1716,26,'Morning Shift',0,NULL,NULL),('ae216f2f-46f8-4d78-ac32-5d7d0ed0b3f3','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,345,'2026-08-14','Fresh Tomato Commercial Tray',1403,1382,21,'Morning Shift',0,NULL,NULL),('b0201f09-093a-4644-94c7-9f7d2a42a4f3',NULL,NULL,NULL,NULL,0,1,1,'2026-08-15','Apple Crate',2500,2480,20,'Morning Shift',0,NULL,NULL),('b6c67ca6-3f23-4caa-9792-e87ac9631fea','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,323,'2026-08-09','Pomegranate Super-Red Crate (5kg)',1713,1688,25,'Morning Shift',0,NULL,NULL),('bd479f72-e986-4b22-95d4-cfc0afbdb9c8','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,315,'2026-08-07','Pomegranate Super-Red Crate (5kg)',1816,1789,27,'Morning Shift',0,NULL,NULL),('c20ba9f4-4e64-4157-9dae-dc4f0ec27b94','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,334,'2026-08-12','Export Grade A Grapes Crate',1584,1561,23,'Morning Shift',0,NULL,NULL),('ccf69483-529b-47f3-9d83-507275e990e7','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,355,'2026-08-17','Pomegranate Super-Red Crate (5kg)',1348,1328,20,'Morning Shift',0,NULL,NULL),('ce3d2752-9c0b-4382-9b2b-9d1b8db7f864','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,344,'2026-08-14','Kesar Mango Export Box (10kg)',1432,1411,21,'Morning Shift',0,NULL,NULL),('d45c7ad3-a502-4666-a9aa-15a2c2e420c0','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,307,'2026-08-05','Pomegranate Super-Red Crate (5kg)',1768,1742,26,'Morning Shift',0,NULL,NULL),('da3a5af5-30e4-4d30-b952-fe9ff5fed8d4','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,335,'2026-08-12','Pomegranate Super-Red Crate (5kg)',1568,1545,23,'Morning Shift',0,NULL,NULL),('dc5a8a96-2ee1-44bb-afcf-eec77405ccde','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,340,'2026-08-13','Kesar Mango Export Box (10kg)',1564,1541,23,'Morning Shift',0,NULL,NULL),('e0199599-d0b3-4516-8f73-1d5988225709','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,330,'2026-08-11','Export Grade A Grapes Crate',1602,1578,24,'Morning Shift',0,NULL,NULL),('e1f83474-f531-4378-b3b5-635387e0b484','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,305,'2026-08-04','Fresh Tomato Commercial Tray',1779,1753,26,'Morning Shift',0,NULL,NULL),('e34a40ed-4901-40fa-a630-d100b914b4bb','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,339,'2026-08-13','Pomegranate Super-Red Crate (5kg)',1581,1558,23,'Morning Shift',0,NULL,NULL),('ed5a1381-8dbb-44ff-af23-a79ed123dafc','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,359,'2026-08-18','Pomegranate Super-Red Crate (5kg)',1284,1265,19,'Morning Shift',0,NULL,NULL),('eda31295-5de4-4af3-8ccb-3301b05d83bb','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,356,'2026-08-17','Kesar Mango Export Box (10kg)',1407,1386,21,'Morning Shift',0,NULL,NULL),('f16756d2-abf9-4a9d-823b-9447fff83d84','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,302,'2026-08-04','Export Grade A Grapes Crate',1876,1848,28,'Morning Shift',0,NULL,NULL),('f21c020a-0257-4ed1-9ff7-c0b97767a8a8','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,331,'2026-08-11','Pomegranate Super-Red Crate (5kg)',1495,1473,22,'Morning Shift',0,NULL,NULL),('fd1f29e5-3215-40fd-9e55-fa75d8624141','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,319,'2026-08-08','Pomegranate Super-Red Crate (5kg)',1765,1739,26,'Morning Shift',0,NULL,NULL);
/*!40000 ALTER TABLE `t_prd_ppd` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_prd_ppm`
--

DROP TABLE IF EXISTS `t_prd_ppm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_prd_ppm` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `ppm_id` int NOT NULL AUTO_INCREMENT,
  `month` varchar(255) NOT NULL,
  `year` int NOT NULL,
  `crates_produced` int NOT NULL,
  `electricity_units` decimal(19,2) DEFAULT NULL,
  `electricity_bill` decimal(19,2) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ppm_id` (`ppm_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_prd_ppm`
--

LOCK TABLES `t_prd_ppm` WRITE;
/*!40000 ALTER TABLE `t_prd_ppm` DISABLE KEYS */;
INSERT INTO `t_prd_ppm` VALUES ('0e2b30e9-06c3-4da7-be53-88198bbc374c',NULL,NULL,NULL,NULL,0,1,1,'AUGUST',2026,75000,15000.00,120000.00,0,NULL,NULL),('3092272d-f9de-4dcb-969f-a47e93ae8553','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,36,'JULY',2026,182000,35000.00,288750.00,0,NULL,NULL),('9c0c52c9-3f58-4c8c-9171-ceab87ea97fb','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,37,'AUGUST',2026,195000,37200.00,306900.00,0,NULL,NULL),('d1e71843-f529-4da7-8dfa-3d00ee6192d2','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,35,'JUNE',2026,155000,29800.00,245850.00,0,NULL,NULL),('f182b575-f770-4674-a51c-1e516113e5a6','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,32,'MARCH',2026,125000,24000.00,198000.00,0,NULL,NULL),('f556ae7f-f1be-4310-bfd3-c66e626e88b8','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,33,'APRIL',2026,142000,27500.00,226875.00,0,NULL,NULL),('ffca483d-f53c-4df0-b9cc-ea9f7916bf98','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,34,'MAY',2026,168000,32000.00,264000.00,0,NULL,NULL);
/*!40000 ALTER TABLE `t_prd_ppm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_sal_sales`
--

DROP TABLE IF EXISTS `t_sal_sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_sal_sales` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `party_id` char(36) NOT NULL,
  `sale_id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `crate_type` varchar(255) NOT NULL,
  `crate_material` varchar(255) NOT NULL,
  `quantity` int NOT NULL,
  `rate` decimal(15,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `paid` decimal(15,2) NOT NULL,
  `remaining` decimal(15,2) NOT NULL,
  `hsn_code` varchar(255) DEFAULT NULL,
  `gst_rate` decimal(15,2) DEFAULT NULL,
  `cgst` decimal(15,2) DEFAULT NULL,
  `sgst` decimal(15,2) DEFAULT NULL,
  `invoice_copy_path` varchar(255) DEFAULT NULL,
  `delivery_challan_path` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_by` varchar(255) DEFAULT NULL,
  `deleted_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sale_id` (`sale_id`),
  KEY `FKk9mblr46up0xnngibvsuorico` (`party_id`),
  CONSTRAINT `FKk9mblr46up0xnngibvsuorico` FOREIGN KEY (`party_id`) REFERENCES `t_crm_party` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_sal_sales`
--

LOCK TABLES `t_sal_sales` WRITE;
/*!40000 ALTER TABLE `t_sal_sales` DISABLE KEYS */;
INSERT INTO `t_sal_sales` VALUES ('0598e4d0-955c-41a8-8b80-862fa06dfade','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'c08c067e-233d-479a-b675-143367d4a036',91,'2026-08-08','Pomegranate Super-Red Crate (5kg)','Plastic',420,165.00,81774.00,69300.00,12474.00,NULL,18.00,6237.00,6237.00,NULL,NULL,0,NULL,NULL),('145c2d19-aaef-44ca-af0e-091899a441f0','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'27b32046-75f4-480d-ba20-4eb1f562cb53',94,'2026-08-11','Export Grade A Grapes Crate','Plastic',510,140.00,84252.00,71400.00,12852.00,NULL,18.00,6426.00,6426.00,NULL,NULL,0,NULL,NULL),('17f7efd3-225e-4af1-bf78-9476787eb897','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'8f201413-4fbf-4bd6-95e0-940d9cdd88c3',88,'2026-08-05','Kesar Mango Export Box (10kg)','Plastic',330,190.00,73986.00,62700.00,11286.00,NULL,18.00,5643.00,5643.00,NULL,NULL,0,NULL,NULL),('4acac6bc-fccd-43ab-93b9-cd7b4b77974a','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'2f5d7b43-9788-43c6-9d2b-1266a3bca6be',83,'2026-07-31','Pomegranate Super-Red Crate (5kg)','Plastic',180,165.00,35046.00,20790.00,14256.00,NULL,18.00,2673.00,2673.00,NULL,NULL,0,NULL,NULL),('5234b484-d47e-43d3-a243-2cc978524517',NULL,NULL,NULL,NULL,0,1,'8f201413-4fbf-4bd6-95e0-940d9cdd88c3',1,'2026-08-13','Apple Crate','Plastic',100,120.00,14160.00,8000.00,6160.00,NULL,18.00,1080.00,1080.00,NULL,NULL,0,NULL,NULL),('5e7d2889-d1f7-4ed5-a306-0cd460b9e3d2','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'e133a43e-a55d-4bfb-855f-c05e1263024c',93,'2026-08-10','Fresh Tomato Commercial Tray','Plastic',480,215.00,121776.00,72240.00,49536.00,NULL,18.00,9288.00,9288.00,NULL,NULL,0,NULL,NULL),('6dbc93ae-d760-4104-8e43-f81b2f588b7d','2026-08-19 10:26:10','2026-08-19 10:26:10','system','system',0,1,'27b32046-75f4-480d-ba20-4eb1f562cb53',82,'2026-07-30','Export Grade A Grapes Crate','Plastic',150,140.00,24780.00,21000.00,3780.00,NULL,18.00,1890.00,1890.00,NULL,NULL,0,NULL,NULL),('74ba8335-60a8-43bc-b2ef-3d14cc7620e7','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'4e59c02c-0e74-44c8-95d7-193c1100f30d',85,'2026-08-02','Fresh Tomato Commercial Tray','Plastic',240,215.00,60888.00,51600.00,9288.00,NULL,18.00,4644.00,4644.00,NULL,NULL,0,NULL,NULL),('7bb30a92-f09a-409b-b55d-e06cc6e337c2','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'d5039da9-37b6-4343-9b7f-3f7c37ae9549',92,'2026-08-09','Kesar Mango Export Box (10kg)','Plastic',450,190.00,100890.00,59850.00,41040.00,NULL,18.00,7695.00,7695.00,NULL,NULL,0,NULL,NULL),('8a3919ad-0b3a-413e-9911-3408c563ca42','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'2f5d7b43-9788-43c6-9d2b-1266a3bca6be',95,'2026-08-12','Pomegranate Super-Red Crate (5kg)','Plastic',540,165.00,105138.00,62370.00,42768.00,NULL,18.00,8019.00,8019.00,NULL,NULL,0,NULL,NULL),('a0c14c3d-cdb5-4038-b023-515a6ce48b6f','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'3661a382-8d19-476a-ae9d-9a8c8b1e511e',96,'2026-08-13','Kesar Mango Export Box (10kg)','Plastic',570,190.00,127794.00,75810.00,51984.00,NULL,18.00,9747.00,9747.00,NULL,NULL,0,NULL,NULL),('a3218c12-bced-4f26-a16c-503879e40c0d','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'4e59c02c-0e74-44c8-95d7-193c1100f30d',97,'2026-08-14','Fresh Tomato Commercial Tray','Plastic',600,215.00,152220.00,129000.00,23220.00,NULL,18.00,11610.00,11610.00,NULL,NULL,0,NULL,NULL),('bb3fbe23-38a3-4d78-b71b-ee353f67b5b5','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'65e62f79-3410-40a5-9963-e731a117031e',87,'2026-08-04','Pomegranate Super-Red Crate (5kg)','Plastic',300,165.00,58410.00,34650.00,23760.00,NULL,18.00,4455.00,4455.00,NULL,NULL,0,NULL,NULL),('bbb2eae6-6344-4ec1-9d4b-330695db2302','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'5de8cf14-b801-4095-a9cd-9f24d2011148',86,'2026-08-03','Export Grade A Grapes Crate','Plastic',270,140.00,44604.00,26460.00,18144.00,NULL,18.00,3402.00,3402.00,NULL,NULL,0,NULL,NULL),('c57f5152-0917-4334-876d-fe09faedbf1d','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'a54f65f9-b4ae-4b52-be61-de9fa5647654',89,'2026-08-06','Fresh Tomato Commercial Tray','Plastic',360,215.00,91332.00,54180.00,37152.00,NULL,18.00,6966.00,6966.00,NULL,NULL,0,NULL,NULL),('cb1d238b-6332-473b-8bac-5ee1acd5b527','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'3661a382-8d19-476a-ae9d-9a8c8b1e511e',84,'2026-08-01','Kesar Mango Export Box (10kg)','Plastic',210,190.00,47082.00,27930.00,19152.00,NULL,18.00,3591.00,3591.00,NULL,NULL,0,NULL,NULL),('f741d9d1-c1f0-46b8-83eb-049cc29fea15','2026-08-19 10:26:11','2026-08-19 10:26:11','system','system',0,1,'af7206bd-e2c7-4a60-98e8-2bda019c6fdf',90,'2026-08-07','Export Grade A Grapes Crate','Plastic',390,140.00,64428.00,38220.00,26208.00,NULL,18.00,4914.00,4914.00,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `t_sal_sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_stock_transfers`
--

DROP TABLE IF EXISTS `t_stock_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_stock_transfers` (
  `id` char(36) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `is_deleted` bit(1) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT NULL,
  `crate_type` varchar(255) NOT NULL,
  `quantity` int NOT NULL,
  `status` varchar(255) DEFAULT NULL,
  `transfer_date` date NOT NULL,
  `destination_branch_id` char(36) DEFAULT NULL,
  `source_branch_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK7twbqnn7jnd5firud5lu0wmqw` (`destination_branch_id`),
  KEY `FK9vtomie2uiuans8xqntursprs` (`source_branch_id`),
  CONSTRAINT `FK7twbqnn7jnd5firud5lu0wmqw` FOREIGN KEY (`destination_branch_id`) REFERENCES `t_branches` (`id`),
  CONSTRAINT `FK9vtomie2uiuans8xqntursprs` FOREIGN KEY (`source_branch_id`) REFERENCES `t_branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_stock_transfers`
--

LOCK TABLES `t_stock_transfers` WRITE;
/*!40000 ALTER TABLE `t_stock_transfers` DISABLE KEYS */;
INSERT INTO `t_stock_transfers` VALUES ('13a6227c-ed2f-4479-9187-8bf5cdd50467','2026-08-19 15:56:11.506343','system',NULL,NULL,_binary '',_binary '\0','2026-08-19 15:56:11.506343','system',0,'Export Grade A Grapes Crate',1500,'RECEIVED','2026-08-15','05da4f3e-bd5f-4c8a-8dba-208b7e2db634','2a22c60c-594b-441a-b1b7-57900df6ca5a'),('b99636f4-a59f-4ee9-b36b-d0bc8880679d','2026-08-19 15:56:11.509266','system',NULL,NULL,_binary '',_binary '\0','2026-08-19 15:56:11.509266','system',0,'Pomegranate Super-Red Crate (5kg)',850,'IN_TRANSIT','2026-08-18','2944271d-e6ff-48dc-b080-d0c60070ac5d','2a22c60c-594b-441a-b1b7-57900df6ca5a');
/*!40000 ALTER TABLE `t_stock_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_sys_settings`
--

DROP TABLE IF EXISTS `t_sys_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_sys_settings` (
  `id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `version` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `config_key` varchar(255) NOT NULL,
  `config_value` text,
  `deleted_by` varchar(100) DEFAULT NULL,
  `deleted_date` datetime(6) DEFAULT NULL,
  `is_deleted` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_sys_settings`
--

LOCK TABLES `t_sys_settings` WRITE;
/*!40000 ALTER TABLE `t_sys_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_sys_settings` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transport`
--

LOCK TABLES `transport` WRITE;
/*!40000 ALTER TABLE `transport` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor`
--

LOCK TABLES `vendor` WRITE;
/*!40000 ALTER TABLE `vendor` DISABLE KEYS */;
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

-- Dump completed on 2026-08-20 19:00:14
