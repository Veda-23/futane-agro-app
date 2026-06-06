# 📘 Standard Operating Procedure (SOP) — UAT & Production Setup Guide

This document details the step-by-step procedures for building, running, and deploying the **UAT (User Acceptance Testing)** and **Production** environments of the Futane Agro ERP application.

---

## 🏛️ 1. Environment Specifications & Configurations

The application supports three distinct environments: **Development**, **UAT**, and **Production**. Each uses separate databases, secrets, configurations, and seeded user roles.

| Configuration Detail | local / Development | UAT (User Acceptance Testing) | Production |
| :--- | :--- | :--- | :--- |
| **Active Spring Profile** | `dev` (Default / Fallback) | `uat` | `prod` |
| **Active Angular Config** | `development` (Default) | `uat` | `production` |
| **Local Port (Manual)** | Frontend: `4200`<br>Backend: `8080`<br>Database: `3306` | Frontend: `4200` (serve)<br>Backend: `8080`<br>Database: `3306` | Frontend: `4200` (serve)<br>Backend: `8080`<br>Database: `3306` |
| **Docker Port (Containerized)**| — | Frontend: `8081` (nginx)<br>Backend: `8082`<br>Database: `3307` | Frontend: `80` (nginx)<br>Backend: `8080`<br>Database: `3306` |
| **Database Schema (Manual)** | `futane_agro` | `futane_erp_uat` | `futane_erp_prod` |
| **Database Schema (Docker)** | — | `futane_agro_uat` | `futane_agro_prod` |
| **Database Host (Docker)** | — | Container: `mysql-uat` | Container: `mysql-prod` |
| **JWT Secret Key** | Base Key | `FutaneAgroERPSecuritySecretKeyForJWTSigningSecureKeyUAT` | `FutaneAgroERPSecuritySecretKeyForJWTSigningSecureKeyPROD` |
| **AES Encryption Key** | Base Key | `FutaneAgroERPUATEncryptionKeySec` | `FutaneAgroERPPRODEncryptionKeySe` |
| **Bootstrap Users** | `admin` (admin123)<br>`manager` (manager123)<br>`accountant` (accountant123)<br>`operator` (operator123) | `UAT_ADMIN` (admin123)<br>`UAT_OPERATOR` (operator123) | `SUPER_ADMIN` (superadmin123)<br>`ADMIN` (admin123)<br>`MANAGER` (manager123)<br>`ACCOUNTANT` (accountant123)<br>`OPERATOR` (operator123)<br>`VIEWER` (viewer123) |

---

## 🛠️ 2. Step-by-Step SOP: Local Manual Deployment

Use this procedure to run the UAT or Production instances directly on a host machine (e.g., your laptop) using Maven and the Angular CLI.

### Prerequisites:
- **Java JDK 8** installed and configured in `PATH`.
- **NodeJS 18+** and **npm** installed.
- Local **MySQL Server 8.0** running on port `3306` with credentials:
  - Username: `root`
  - Password: `Vedant`

---

### Phase A: Setup the Databases
1. Open your MySQL client (CLI, Workbench, or DBeaver).
2. Execute the following commands to initialize empty schemas:
   ```sql
   -- Create UAT Schema
   CREATE DATABASE IF NOT EXISTS futane_erp_uat;

   -- Create Production Schema
   CREATE DATABASE IF NOT EXISTS futane_erp_prod;
   ```

---

### Phase B: Launching the Backend Server

To start the Spring Boot backend with a specific environment profile:

#### 1. Running in UAT Mode:
Open a terminal in the `./backend` directory and run:
```powershell
# Set active profile and run via Maven
mvn spring-boot:run -Dspring-boot.run.profiles=uat
```
*   **Result**: The server runs on port **8080**.
*   **Log Output**: You will see `The following 1 profile is active: "uat"` and `✓ UAT Users seeded with BCrypt-encoded passwords.`
*   **Database Check**: Tables will auto-generate in `futane_erp_uat`, and users `UAT_ADMIN` and `UAT_OPERATOR` will be seeded.

#### 2. Running in Production Mode:
Open a terminal in the `./backend` directory and run:
```powershell
# Set active profile and run via Maven
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```
*   **Result**: The server runs on port **8080**.
*   **Log Output**: You will see `The following 1 profile is active: "prod"` and `✓ Production Users seeded with BCrypt-encoded passwords.`
*   **Database Check**: Tables will auto-generate in `futane_erp_prod`, and users `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `ACCOUNTANT`, `OPERATOR`, and `VIEWER` will be seeded.

---

### Phase C: Launching the Frontend Client

To serve the Angular client locally with environment-specific routing:

#### 1. Running in UAT Mode:
Open a terminal in the `./frontend` directory and run:
```bash
# Serves Angular using the UAT configuration mapping
npx ng serve --configuration=uat
```
*   **Target API URL**: Maps to `http://uat.futaneagro.local:8080/api` (as defined in `environment.uat.ts`).
*   *Note*: Ensure you map `127.0.0.1 uat.futaneagro.local` in your hosts file or use the top navigation header input to direct requests to the live backend.

#### 2. Running in Production Mode:
Open a terminal in the `./frontend` directory and run:
```bash
# Serves Angular using the Production configuration mapping
npx ng serve --configuration=production
```
*   **Target API URL**: Maps to `https://erp.futaneagro.com/api` (as defined in `environment.prod.ts`).

---

### Phase D: Packaging/Compiling the Application

To build standalone, optimized deployment bundles:

#### 1. Package Backend (JAR):
```bash
cd backend
mvn clean package -DskipTests
```
*   **Artifact location**: `backend/target/futane-agro-app-0.0.1-SNAPSHOT.jar`

#### 2. Package Frontend (HTML/JS):
```bash
cd frontend
# For UAT deployment
npx ng build --configuration=uat

# For Production deployment
npx ng build --configuration=production
```
*   **Artifact location**: `frontend/dist/frontend/browser`

---

## 🐳 3. Step-by-Step SOP: Containerized Docker Deployment

This is the recommended approach for staging and live environments. It spins up isolated MySQL instances, backends, and Nginx reverse-proxies automatically.

### Prerequisites:
- **Docker Desktop** installed and running on Windows.
- Free host ports:
  - **UAT**: Host ports `8081`, `8082`, and `3307` must be free.
  - **Production**: Host ports `80`, `8080`, and `3306` must be free.

---

### 🧪 Setup & Run: UAT Environment (Docker Compose)

1. Open a PowerShell/CMD terminal in the project root directory.
2. Run the build and startup command:
   ```powershell
   docker-compose -f docker-compose.uat.yml up --build -d
   ```
3. **What this does**:
   - Downloads/runs a MySQL container (`futane_agro_mysql_uat`) on host port `3307`.
   - Compiles the backend container (`futane_agro_backend_uat`) on port `8082` with the active profile `uat`.
   - Compiles the frontend (`futane_agro_frontend_uat`) using `BUILD_CONFIG=uat` and serves it via Nginx on port `8081`.
4. **Verifying UAT**:
   - Access the UAT portal in your browser: `http://localhost:8081`
   - Log in using credentials:
     - Username: `UAT_ADMIN`
     - Password: `admin123`
   - Retrieve OTP from docker logs:
     ```powershell
     docker logs futane_agro_backend_uat
     ```

---

### 🚀 Setup & Run: Production Environment (Docker Compose)

1. Open a PowerShell/CMD terminal in the project root directory.
2. Run the build and startup command:
   ```powershell
   docker-compose -f docker-compose.prod.yml up --build -d
   ```
3. **What this does**:
   - Downloads/runs a MySQL container (`futane_agro_mysql_prod`) on host port `3306`.
   - Compiles the backend container (`futane_agro_backend_prod`) on port `8080` with active profile `prod`.
   - Compiles the frontend (`futane_agro_frontend_prod`) using `BUILD_CONFIG=production` and serves it via Nginx on port `80`.
4. **Verifying Production**:
   - Access the Production portal in your browser: `http://localhost:80` (or `http://localhost`)
   - Log in using credentials:
     - Username: `SUPER_ADMIN`
     - Password: `superadmin123`
   - Retrieve OTP from docker logs:
     ```powershell
     docker logs futane_agro_backend_prod
     ```

---

## 🧹 4. Teardown / Maintenance SOP

To clean up docker resources or reset databases:

### Stop UAT Containers:
```powershell
docker-compose -f docker-compose.uat.yml down
```

### Stop Production Containers:
```powershell
docker-compose -f docker-compose.prod.yml down
```

### Reset / Wipe UAT Databases (Fresh State):
```powershell
docker-compose -f docker-compose.uat.yml down -v
```
*(Wipes the database volume. On the next startup, database tables will rebuild and bootstrap fresh users).*

### Reset / Wipe Production Databases (Fresh State):
```powershell
docker-compose -f docker-compose.prod.yml down -v
```
