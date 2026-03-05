# RBI System – Backup and Recovery

This document describes backup and recovery procedures for the Barangay RBI Digital Management System (MongoDB + Node backend).

## Database backup (MongoDB)

The system stores all data in MongoDB. Regular backups are required for reliability and compliance.

### Manual backup (mongodump)

```bash
# Full dump to a directory (default: dump/)
mongodump --uri="<MONGO_URI>" --out=./backup-$(date +%Y%m%d)

# Compress (optional)
tar -czvf backup-$(date +%Y%m%d).tar.gz backup-$(date +%Y%m%d)
```

Use the same connection string as in the application `.env` (`MONGO_URI`). Ensure the dump user has read access to the database.

### Restore

```bash
mongorestore --uri="<MONGO_URI>" --drop ./backup-YYYYMMDD
```

`--drop` drops existing collections before restore. Omit for partial or non-destructive restore.

### Automated backups

- Schedule `mongodump` via cron (Linux) or Task Scheduler (Windows) at least daily.
- Retain backups for a period consistent with the Data Privacy Act and local policy (e.g. 30 days).
- Store backups in a secure, access-controlled location.

## Application and configuration

- Backend code and `package.json` are versioned in git; ensure repo is backed up or replicated.
- Keep `.env` (and any secrets) in a secure, backed-up location; do not commit them to the repo.

## Error handling and recovery

- The backend uses try/catch and returns appropriate HTTP status codes.
- On failure, fix the cause (e.g. DB connectivity, validation), then retry; restore from backup only when data loss or corruption is confirmed.
