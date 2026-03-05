import Household from '../models/Household.js';
import FormB from '../models/FormB.js';
import { validationResult } from 'express-validator';
import { logActivity } from '../utils/activityLogger.js';

async function syncHouseholdToFormB(household) {
  const inhabitants = household.inhabitants || [];
  for (let i = 0; i < inhabitants.length; i++) {
    const inv = inhabitants[i];
    const residenceAddress = (inv.residenceAddress && inv.residenceAddress.trim()) ? inv.residenceAddress.trim() : (household.householdAddress || '');
    const payload = {
      household: household._id,
      inhabitantIndex: i,
      region: household.region || '',
      province: household.province || '',
      cityMunicipality: household.cityMunicipality || '',
      barangay: household.barangay || '',
      householdNumber: household.householdNumber || '',
      residenceAddress,
      dataSource: household.dataSource || 'self-entered',
      status: household.status || 'draft',
      createdBy: household.createdBy,
      enteredBy: household.enteredBy,
      lastModifiedBy: household.lastModifiedBy,
      lastName: inv.lastName,
      firstName: inv.firstName,
      middleName: inv.middleName,
      nameExtension: inv.nameExtension,
      placeOfBirth: inv.placeOfBirth,
      dateOfBirth: inv.dateOfBirth,
      age: inv.age,
      sex: inv.sex || '',
      civilStatus: inv.civilStatus || '',
      citizenship: inv.citizenship,
      religion: inv.religion,
      contactNumber: inv.contactNumber,
      email: inv.email,
      occupation: inv.occupation,
      philSysCardNo: inv.philSysCardNo,
      highestEducationalAttainment: inv.highestEducationalAttainment || '',
      graduateOrUndergraduate: inv.graduateOrUndergraduate || '',
      courseSpecification: inv.courseSpecification,
      isLaborEmployed: !!inv.isLaborEmployed,
      isUnemployed: !!inv.isUnemployed,
      isPWD: !!inv.isPWD,
      isOFW: !!inv.isOFW,
      isSoloParent: !!inv.isSoloParent,
      isOSY: !!inv.isOSY,
      isOSC: !!inv.isOSC,
      isIP: !!inv.isIP,
      consentObtainedAt: inv.consentObtainedAt,
    };
    await FormB.findOneAndUpdate(
      { household: household._id, inhabitantIndex: i },
      { $set: payload },
      { upsert: true, new: true }
    );
  }
  await FormB.deleteMany({
    household: household._id,
    inhabitantIndex: { $gte: inhabitants.length },
  });
}

const staffRoles = ['encoder', 'secretary', 'punong_barangay', 'viewer'];
const canSetHouseholdNumber = ['secretary', 'punong_barangay', 'admin'];
const canCertify = ['secretary', 'admin'];
const canValidate = ['punong_barangay', 'admin'];

function getListFilter(req) {
  const { user } = req;
  if (user.role === 'admin') return {};
  if (user.role === 'resident') {
    return { createdBy: user._id };
  }
  if (staffRoles.includes(user.role) && user.barangay) {
    const b = String(user.barangay).trim();
    if (b) {
      return { barangay: new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }
  }
  return {};
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
}

export const list = async (req, res) => {
  try {
    const filter = getListFilter(req);
    const { barangay, cityMunicipality, status, search, address, householdNumber, page = 1, limit = 20 } = req.query;
    if (barangay) filter.barangay = barangay;
    if (cityMunicipality) filter.cityMunicipality = cityMunicipality;
    if (status) filter.status = status;
    if (householdNumber && escapeRegex(householdNumber)) {
      filter.householdNumber = new RegExp(escapeRegex(householdNumber), 'i');
    }
    if (address && escapeRegex(address)) {
      filter.householdAddress = new RegExp(escapeRegex(address), 'i');
    }
    if (search && escapeRegex(search)) {
      const re = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { headOfFamily: re },
        { householdAddress: re },
        { householdNumber: re },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [households, total] = await Promise.all([
      Household.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).populate('enteredBy lastModifiedBy certifiedBy validatedBy', 'fullName email'),
      Household.countDocuments(filter),
    ]);
    res.json({ households, total, page: parseInt(page, 10), limit: limitNum });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const filter = getListFilter(req);
    const household = await Household.findOne({ _id: req.params.id, ...filter })
      .populate('enteredBy lastModifiedBy certifiedBy validatedBy createdBy', 'fullName email');
    if (!household) return res.status(404).json({ message: 'Household not found' });
    res.json(household);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const data = { ...req.body };
    data.createdBy = req.user._id;
    data.enteredBy = req.user._id;
    data.lastModifiedBy = req.user._id;
    if (req.body.dataSource) data.dataSource = req.body.dataSource;
    if (req.body.consentObtainedAt) data.consentObtainedAt = new Date(req.body.consentObtainedAt);
    if (req.user.role === 'resident') {
      data.dataSource = 'self-entered';
    } else if (staffRoles.includes(req.user.role) && req.user.barangay) {
      if (!data.barangay) data.barangay = req.user.barangay;
      if (!data.dataSource) data.dataSource = 'staff-assisted';
    }
    if (data.inhabitants?.length) data.numberOfMembers = data.inhabitants.length;
    const household = await Household.create(data);
    await syncHouseholdToFormB(household);
    logActivity(req, { action: 'create', resource: 'household', resourceId: household._id.toString() });
    res.status(201).json(household);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const filter = getListFilter(req);
    const household = await Household.findOne({ _id: req.params.id, ...filter });
    if (!household) return res.status(404).json({ message: 'Household not found' });

    const canEditNumber = canSetHouseholdNumber.includes(req.user.role);
    const data = { ...req.body };
    data.lastModifiedBy = req.user._id;
    if (!canEditNumber && data.householdNumber !== undefined) delete data.householdNumber;
    if (data.inhabitants?.length !== undefined) data.numberOfMembers = data.inhabitants.length;
    Object.assign(household, data);
    if (Array.isArray(data.inhabitants)) {
      household.markModified('inhabitants');
    }
    await household.save();
    await syncHouseholdToFormB(household);
    logActivity(req, { action: 'update', resource: 'household', resourceId: household._id.toString() });
    res.json(household);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const filter = getListFilter(req);
    const household = await Household.findOneAndDelete({ _id: req.params.id, ...filter });
    if (!household) return res.status(404).json({ message: 'Household not found' });
    logActivity(req, { action: 'delete', resource: 'household', resourceId: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const certify = async (req, res) => {
  try {
    if (!canCertify.includes(req.user.role)) return res.status(403).json({ message: 'Only Secretary can certify' });
    const filter = getListFilter(req);
    const household = await Household.findOne({ _id: req.params.id, ...filter });
    if (!household) return res.status(404).json({ message: 'Household not found' });
    if (household.status !== 'submitted') return res.status(400).json({ message: 'Only submitted records can be certified' });
    household.status = 'certified';
    household.certifiedBy = req.user._id;
    household.certifiedAt = new Date();
    household.lastModifiedBy = req.user._id;
    await household.save();
    await FormB.updateMany(
      { household: household._id },
      { $set: { status: 'certified', certifiedBy: req.user._id, certifiedAt: household.certifiedAt, lastModifiedBy: req.user._id } }
    );
    res.json(household);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const validate = async (req, res) => {
  try {
    if (!canValidate.includes(req.user.role)) return res.status(403).json({ message: 'Only Punong Barangay can validate' });
    const filter = getListFilter(req);
    const household = await Household.findOne({ _id: req.params.id, ...filter });
    if (!household) return res.status(404).json({ message: 'Household not found' });
    if (household.status !== 'certified') return res.status(400).json({ message: 'Only certified records can be validated' });
    household.status = 'validated';
    household.validatedBy = req.user._id;
    household.validatedAt = new Date();
    household.lastModifiedBy = req.user._id;
    await household.save();
    await FormB.updateMany(
      { household: household._id },
      { $set: { status: 'validated', validatedBy: req.user._id, validatedAt: household.validatedAt, lastModifiedBy: req.user._id } }
    );
    res.json(household);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submit = async (req, res) => {
  try {
    const filter = getListFilter(req);
    const household = await Household.findOne({ _id: req.params.id, ...filter });
    if (!household) return res.status(404).json({ message: 'Household not found' });
    if (household.status !== 'draft') return res.status(400).json({ message: 'Only draft can be submitted' });
    household.status = 'submitted';
    household.preparedBy = req.body.preparedBy || req.user.fullName;
    household.preparedAt = new Date();
    household.lastModifiedBy = req.user._id;
    await household.save();
    await FormB.updateMany(
      { household: household._id },
      { $set: { status: 'submitted', preparedBy: household.preparedBy, preparedAt: household.preparedAt, lastModifiedBy: req.user._id } }
    );
    res.json(household);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
