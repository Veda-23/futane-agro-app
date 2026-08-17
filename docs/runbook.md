# 📘 Futane Agro ERP — System Administrator Production Runbook

## 1. System Architecture & Topology

- **Production Frontend**: `http://localhost:4200` (or Port 80 in Docker / Nginx)
- **Production Backend**: `http://localhost:8080` (Spring Boot 2.7, Java 17)
- **Production Database**: MySQL 8.0 `futane_erp_prod` on Port 3306
- **UAT Frontend**: `http://localhost:4201`
- **UAT Backend**: `http://localhost:8081`
- **UAT Database**: MySQL 8.0 `futane_erp_uat` on Port 3306

---

## 2. Routine Operation & Service Controls

### Launching via Local Node / Spring Boot
```powershell
# Starting UAT Frontend (Port 4201):
cd frontend && npm run start:uat

# Starting PROD Frontend (Port 4200):
cd frontend && npm run start:prod

# Starting Backend with Profile:
cd backend && java -jar target/futane-agro-app-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### Full-Stack Docker Launch
```powershell
# Launch all microservices:
docker-compose up -d --build

# View container logs:
docker-compose logs -f backend

# Graceful stop:
docker-compose down
```

---

## 3. Database Backup & Disaster Recovery

### Automated Daily Backups
The automated backup scheduler runs nightly at 11:30 PM via `ScheduledBackupService.java` or scheduled task:
```powershell
# Manual Backup Trigger:
powershell -ExecutionPolicy Bypass -File .\scripts\db-backup-scheduler.ps1 -DbName futane_erp_prod -BackupDir C:\ERP_Backups
```

### Emergency Database Restore Procedure
1. Locate the latest verified backup in `C:\ERP_Backups\`.
2. Unpack and stream SQL dump into target database:
```powershell
# 1. Decompress
Expand-Archive -Path "C:\ERP_Backups\futane_erp_prod_20260817.sql.zip" -DestinationPath "C:\ERP_Backups\Temp"

# 2. Ingest into MySQL
mysql -u root -p futane_erp_prod < "C:\ERP_Backups\Temp\futane_erp_prod_20260817.sql"

# 3. Clean temporary files
Remove-Item -Recurse -Force "C:\ERP_Backups\Temp"
```

---

## 4. Health Checks & Smoke Testing

Run the automated smoke test suite after every deployment:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1 -BaseUrl "http://localhost:8080"
```

### Actuator Monitoring Endpoints
- Health: `GET http://localhost:8080/actuator/health`
- Prometheus Metrics: `GET http://localhost:8080/actuator/prometheus`
- Database Latency Indicator: Included within `/actuator/health` response
