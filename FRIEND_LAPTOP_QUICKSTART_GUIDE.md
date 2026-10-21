# How to Run Futane Agro ERP on Your Laptop (Zero-Bug Friend's Guide)

> **Welcome!** If you just cloned this repository from GitHub, this guide will walk you through launching the entire ERP system on your laptop in **under 2 minutes** with **zero setup errors**.

---

## 🚀 Quickest Way: 1-Click Launch (Windows)

1. Open the repository folder.
2. Double-click the file:
   ```bat
   quick-start.bat
   ```
3. **What happens automatically:**
   - If you have **Docker Desktop**: It asks if you want to run via Docker (Enter `1`). Everything boots in isolated containers automatically.
   - If you don't have Docker: It checks for **Java 17+** and **Node.js 18+**, boots the backend and frontend servers, and opens `http://localhost:4300` in your browser.

*(If you are on **Mac or Linux**, open a terminal in the folder and run `./quick-start.sh`)*.

---

## 🐳 Option 2: 1-Command Docker Launch (Mac, Windows, Linux)

If you have Docker Desktop running:
```bash
docker compose -f docker-compose.uat.yml up -d
```
That's it!
- **PostgreSQL 16**, **Spring Boot Backend**, and **Angular Frontend** will start together.
- All 39 database tables will be created and pre-loaded with realistic demo data automatically on boot.
- Open your browser to: **[http://localhost:4300](http://localhost:4300)**

---

## 💻 Option 3: Standard Local Run (No Docker)

If you prefer running directly on your laptop without Docker:

### Prerequisites:
1. **Java 17 or higher** (`java -version`)
2. **Node.js 18 or higher** (`node -v`)
3. **PostgreSQL 16** running on port `5432` with database `futane_erp_uat`  
   *(Default password in `application-uat.properties`: `FutaneAgro#Secure2026!App` or `Vedant`)*

### Commands to Run:
Open two terminal windows:

**Terminal 1 (Backend):**
```bash
java -Xms128m -Xmx384m -jar backend/target/futane-agro-app-0.0.1-SNAPSHOT.jar --spring.profiles.active=uat --server.port=8081
```
*(Wait 10 seconds until you see `Tomcat started on port(s): 8081`)*.

**Terminal 2 (Frontend):**
```bash
node scripts/lightweight-server.js 4300
```
Open **[http://localhost:4300](http://localhost:4300)**.

---

## 🔑 Login Credentials Matrix

| User | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Full Super Admin** | `SUPER_ADMIN` | `superadmin123` | Complete system control, tenant customization, feature flags, API keys |
| **Business Admin** | `ADMIN` | `admin123` | Invoices, sales, dispatch, customers, vendors |
| **Factory Manager** | `MANAGER` | `manager123` | Production runs (PPD/PPM), inventory reorders, machines |
| **Accountant** | `ACCOUNTANT` | `accountant123` | GST ledgers, payment collections, vouchers |
| **Machine Operator** | `OPERATOR` | `operator123` | Shift logging, crate reject recording |

### How to Handle 2FA / OTP Code:
When you click **Login**, the system asks for a 6-digit OTP code:
- In testing/development mode, **the code is printed right in your backend terminal console!**
- It is also returned in the login response (`tempOtp`).
- Type the 6-digit number and click **Verify** to immediately enter the dashboard.

---

## 🌐 URLs & Ports Directory

- **ERP Web Application:** [http://localhost:4300](http://localhost:4300)
- **Spring Boot Backend:** `http://localhost:8081/api`
- **Backend Health Check:** [http://localhost:8081/actuator/health](http://localhost:8081/actuator/health)
- **Visual Database Studio:** [http://localhost:5433](http://localhost:5433) *(Double click `open-database-ui.bat`)*
- **PostgreSQL Database Port:** `5432`

---

## 🛠️ Common Issues & Fast Fixes

### 1. "Port 8081 or 4300 is already in use"
Double-click `clean-processes.bat` in the project root. It will safely terminate any hanging background processes and release the ports.

### 2. "The browser shows Connection Refused"
Make sure both the backend (port 8081) and frontend (port 4300) are running. If you used `quick-start.bat`, wait 10 seconds for the services to finish initializing.

### 3. "My laptop feels slow or has only 8GB RAM"
Double-click `start-ram-watchdog.bat`. This ERP is specially optimized to run capped at < 400 MB RAM and will keep your laptop cool and lag-free.

---

## 📖 Complete Master Documentation
For the full master manual with screenshots of all 16 modules, open:
👉 `docs/FUTANE_AGRO_ERP_COMPLETE_SOP.pdf` or `docs/MASTER_PROJECT_SOP_AND_USER_GUIDE.md`
