#!/bin/bash
# =========================================================
# FUTANE AGRO ERP - ENTERPRISE DISASTER RECOVERY & BACKUP
# =========================================================
# Phase 7: Automated Backup Strategy
# Features: Full Backups, Binlog sync for PITR (Point-In-Time)

BACKUP_DIR="/var/backups/erp_mysql"
DB_NAME="futane_agro_prod"
DB_CONTAINER="futane_agro_mysql_prod"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

echo "Starting Enterprise Backup for $DB_NAME at $DATE..."

# 1. Full Database Dump (Schema + Data + Triggers + Routines)
sudo docker exec $DB_CONTAINER mysqldump -uroot -pVedant --routines --events --triggers --single-transaction --flush-logs --master-data=2 $DB_NAME > $BACKUP_DIR/full_backup_$DATE.sql

# Compress backup to save space
gzip $BACKUP_DIR/full_backup_$DATE.sql

# 2. Incremental Backup (Flushing and copying Binlogs)
# Flush logs rotates the binlog, then we copy the previous logs for PITR
sudo docker exec $DB_CONTAINER mysqladmin -uroot -pVedant flush-logs
sudo docker cp $DB_CONTAINER:/var/lib/mysql/ $BACKUP_DIR/binlogs_$DATE/

# 3. Clean up old backups (Retention Policy)
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -exec rm {} \;
find $BACKUP_DIR -type d -name "binlogs_*" -mtime +$RETENTION_DAYS -exec rm -rf {} \;

echo "Backup complete! File saved as $BACKUP_DIR/full_backup_$DATE.sql.gz"

# ---------------------------------------------------------
# RESTORE INSTRUCTIONS (Point In Time Recovery)
# ---------------------------------------------------------
# 1. Restore the last Full Backup:
#    zcat full_backup_YYYY-MM-DD.sql.gz | sudo docker exec -i futane_agro_mysql_prod mysql -uroot -pVedant futane_agro_prod
#
# 2. Replay the Binlogs up to the crash time (e.g., 14:30:00):
#    mysqlbinlog --stop-datetime="2026-07-17 14:30:00" binlog.0000X | sudo docker exec -i futane_agro_mysql_prod mysql -uroot -pVedant
# =========================================================
