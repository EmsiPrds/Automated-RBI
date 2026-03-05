# RBI System – Operations and Non-Functional Requirements

## Activity logging

Sensitive actions are logged to the `activitylogs` collection in MongoDB for audit and Data Privacy Act alignment.

- **Logged actions:** login, create/update/delete household, create/update/delete Form B (resident), generate certificate.
- **Fields:** action, resource, resourceId, userId, userEmail, role, details, ip, userAgent, createdAt.
- Logs are written asynchronously and do not block requests. Retention should be defined by policy (e.g. 1 year).

To query recent activity (e.g. in mongo shell):

```javascript
db.activitylogs.find().sort({ createdAt: -1 }).limit(50)
```

## Performance

- **Indexes:** The backend defines indexes on Household, FormB, User, and ActivityLog (e.g. barangay, status, householdNumber, createdAt). These support list filters and report queries.
- **Targets (from spec):** Page load within 2 seconds; support up to 10 concurrent users; handle at least 10,000 resident records.
- **Recommendations:** For large datasets, ensure MongoDB has sufficient memory and that list endpoints use pagination (already implemented with `page` and `limit`). Monitor slow queries via MongoDB profiling if needed.

## Reliability

- **Backup:** See [BACKUP.md](BACKUP.md) for MongoDB backup and restore.
- **Error handling:** API errors return appropriate status codes and messages; frontend shows user-friendly messages and retries where applicable.
