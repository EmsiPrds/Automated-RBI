export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};

export const requireBarangayScope = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  const staffRoles = ['encoder', 'secretary', 'punong_barangay'];
  if (staffRoles.includes(req.user.role) && !req.user.barangay) {
    return res.status(403).json({ message: 'Barangay assignment required for this role' });
  }
  next();
};
