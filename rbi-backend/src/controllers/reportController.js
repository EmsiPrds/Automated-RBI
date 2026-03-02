import Household from '../models/Household.js';

const staffRoles = ['encoder', 'secretary', 'punong_barangay'];

function getBarangayFilter(req) {
  const { user } = req;
  const filter = {};
  if (user.role === 'resident') return null;
  if (staffRoles.includes(user.role) && user.barangay) filter.barangay = user.barangay;
  return Object.keys(filter).length ? filter : {};
}

export const summary = async (req, res) => {
  try {
    const baseFilter = getBarangayFilter(req);
    if (baseFilter === null) return res.status(403).json({ message: 'Residents cannot access reports' });
    const { barangay } = req.query;
    const filter = { ...baseFilter };
    if (barangay) filter.barangay = barangay;

    const households = await Household.find(filter);
    let totalInhabitants = 0;
    const counts = {
      totalHouseholds: households.length,
      totalInhabitants: 0,
      byStatus: { draft: 0, submitted: 0, certified: 0, validated: 0 },
      isPWD: 0,
      isOFW: 0,
      isSoloParent: 0,
      isOSY: 0,
      isOSC: 0,
      isIP: 0,
      isLaborEmployed: 0,
      isUnemployed: 0,
    };

    for (const h of households) {
      counts.byStatus[h.status] = (counts.byStatus[h.status] || 0) + 1;
      for (const inv of h.inhabitants || []) {
        totalInhabitants++;
        if (inv.isPWD) counts.isPWD++;
        if (inv.isOFW) counts.isOFW++;
        if (inv.isSoloParent) counts.isSoloParent++;
        if (inv.isOSY) counts.isOSY++;
        if (inv.isOSC) counts.isOSC++;
        if (inv.isIP) counts.isIP++;
        if (inv.isLaborEmployed) counts.isLaborEmployed++;
        if (inv.isUnemployed) counts.isUnemployed++;
      }
    }
    counts.totalInhabitants = totalInhabitants;
    res.json(counts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
