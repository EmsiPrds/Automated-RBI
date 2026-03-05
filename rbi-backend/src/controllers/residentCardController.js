import ResidentCard from '../models/ResidentCard.js';
import Household from '../models/Household.js';

async function generateIdNumber() {
  const year = new Date().getFullYear();
  const count = await ResidentCard.countDocuments({
    idNumber: new RegExp(`^RBI-${year}-`),
  });
  const seq = String(count + 1).padStart(5, '0');
  return `RBI-${year}-${seq}`;
}

export const getMyCard = async (req, res) => {
  try {
    if (req.user.role !== 'resident') {
      return res.status(403).json({
        message: 'Only residents can access the Digital ID',
        eligible: false,
      });
    }

    let card = await ResidentCard.findOne({ user: req.user._id })
      .populate('household', 'region province cityMunicipality barangay householdAddress')
      .populate('user', 'fullName');

    if (!card) {
      const validatedHousehold = await Household.findOne({
        createdBy: req.user._id,
        status: 'validated',
      })
        .sort({ validatedAt: -1 })
        .select('_id region province cityMunicipality barangay householdAddress');

      if (!validatedHousehold) {
        return res.status(404).json({
          message:
            'Complete and submit your household form; after certification and validation you will receive your Digital ID.',
          eligible: false,
        });
      }

      const idNumber = await generateIdNumber();
      card = await ResidentCard.create({
        user: req.user._id,
        household: validatedHousehold._id,
        idNumber,
      });
      await card.populate('household', 'region province cityMunicipality barangay householdAddress');
      await card.populate('user', 'fullName');
    }

    const h = card.household;
    const u = card.user;
    const verifyPath = `/verify/${card.idNumber}`;

    res.json({
      idNumber: card.idNumber,
      issuedAt: card.issuedAt,
      fullName: u?.fullName || req.user.fullName,
      barangay: h?.barangay || '',
      cityMunicipality: h?.cityMunicipality || '',
      province: h?.province || '',
      region: h?.region || '',
      householdAddress: h?.householdAddress || '',
      verifyPath,
      eligible: true,
    });
  } catch (err) {
    console.error('GET /api/resident-card', err.message || err);
    res.status(500).json({ message: err.message });
  }
};

export const verifyByIdNumber = async (req, res) => {
  try {
    const card = await ResidentCard.findOne({ idNumber: req.params.idNumber })
      .populate('user', 'fullName')
      .populate('household', 'barangay cityMunicipality');

    if (!card) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid or expired ID',
      });
    }

    res.json({
      valid: true,
      fullName: card.user?.fullName || '—',
      barangay: card.household?.barangay || '—',
      cityMunicipality: card.household?.cityMunicipality || '—',
      issuedAt: card.issuedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
