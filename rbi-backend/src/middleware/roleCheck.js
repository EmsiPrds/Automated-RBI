export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};

export const requireBarangayScope = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (req.user.role === 'admin') return next();
  const staffRoles = ['encoder', 'secretary', 'punong_barangay', 'viewer'];
  if (staffRoles.includes(req.user.role) && !req.user.barangay) {
    return res.status(403).json({ message: 'Barangay assignment required for this role' });
  }
  next();
};

/** Block viewer role (read-only); use on create/update/delete. */
export const requireNotViewer = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (req.user.role === 'viewer') {
    return res.status(403).json({ message: 'Viewer has read-only access' });
  }
  next();
};
