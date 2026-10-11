# BACKUP, DISASTER RECOVERY & CONTINUITY PLAN

## 1. Database Backup Cadence
- **Point-in-Time Recovery (PITR):** Continuous Write-Ahead Log (WAL) archiving allowing rollback to any second in the past 7 to 30 days.
- **Daily Automated Snapshots:** Encrypted full database dump generated every night at 02:00 AM IST and synced to geo-redundant cold storage (AWS S3 Glacier).
- **Retention Schedule:**
  - Daily backups retained for 30 days.
  - Monthly archives retained for 7 years for GST and statutory tax compliance.

## 2. Recovery Time & Point Objectives
- **RTO (Recovery Time Objective):** < 15 minutes for full service restoration.
- **RPO (Recovery Point Objective):** < 5 minutes of data loss under catastrophic failure.

## 3. Disaster Recovery Drill
1. Provision new database instance from the latest PITR timestamp.
2. Verify table row counts and foreign key constraints.
3. Update database connection string in secret manager and reload container runtime.
4. Run automated sanity test suite to confirm tenant data integrity.
