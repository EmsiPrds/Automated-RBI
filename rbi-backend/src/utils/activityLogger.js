import ActivityLog from '../models/ActivityLog.js';

/**
 * Log a sensitive action for audit (Data Privacy Act / NFR).
 * Fire-and-forget; does not block the request.
 */
export function logActivity(req, data) {
  const user = data.user ?? req.user;
  const payload = {
    action: data.action,
    resource: data.resource,
    resourceId: data.resourceId,
    userId: user?._id,
    userEmail: user?.email,
    role: user?.role,
    details: data.details,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get?.('user-agent'),
  };
  ActivityLog.create(payload).catch((err) => console.error('ActivityLog create error:', err.message));
}
