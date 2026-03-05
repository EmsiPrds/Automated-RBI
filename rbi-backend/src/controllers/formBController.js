import FormB from '../models/FormB.js';
import { validationResult } from 'express-validator';
import { logActivity } from '../utils/activityLogger.js';

const staffRoles = ['encoder', 'secretary', 'punong_barangay', 'viewer'];
const canSetHouseholdNumber = ['secretary', 'punong_barangay', 'admin'];
const canCertify = ['secretary', 'admin'];
const canValidate = ['punong_barangay', 'admin'];

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
}

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

export const list = async (req, res) => {
  try {
    const filter = getListFilter(req);
    const { barangay, cityMunicipality, status, search, philsys, address, householdNumber, page = 1, limit = 20 } = req.query;
    if (barangay) filter.barangay = barangay;
    if (cityMunicipality) filter.cityMunicipality = cityMunicipality;
    if (status) filter.status = status;
    if (philsys && escapeRegex(philsys)) filter.philSysCardNo = new RegExp(escapeRegex(philsys), 'i');
    if (address && escapeRegex(address)) filter.residenceAddress = new RegExp(escapeRegex(address), 'i');
    if (householdNumber && escapeRegex(householdNumber)) filter.householdNumber = new RegExp(escapeRegex(householdNumber), 'i');
    if (search && escapeRegex(search)) {
      const re = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { lastName: re },
        { firstName: re },
        { middleName: re },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [records, total] = await Promise.all([
      FormB.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).populate('enteredBy lastModifiedBy certifiedBy validatedBy', 'fullName email'),
      FormB.countDocuments(filter),
    ]);
    res.json({ records, total, page: parseInt(page, 10), limit: limitNum });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const filter = getListFilter(req);
    const record = await FormB.findOne({ _id: req.params.id, ...filter })
      .populate('enteredBy lastModifiedBy certifiedBy validatedBy createdBy', 'fullName email');
    if (!record) return res.status(404).json({ message: 'Form B record not found' });
    res.json(record);
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
    if (req.body.dateOfBirth) data.dateOfBirth = new Date(req.body.dateOfBirth);
    if (req.body.dateAccomplished) data.dateAccomplished = new Date(req.body.dateAccomplished);
    if (req.user.role === 'resident') {
      data.dataSource = 'self-entered';
    } else if (staffRoles.includes(req.user.role) && req.user.barangay) {
      if (!data.barangay) data.barangay = req.user.barangay;
      if (!data.dataSource) data.dataSource = 'staff-assisted';
    }
    const record = await FormB.create(data);
    logActivity(req, { action: 'create', resource: 'formB', resourceId: record._id.toString() });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const filter = getListFilter(req);
    const record = await FormB.findOne({ _id: req.params.id, ...filter });
    if (!record) return res.status(404).json({ message: 'Form B record not found' });

    const canEditNumber = canSetHouseholdNumber.includes(req.user.role);
    const data = { ...req.body };
    data.lastModifiedBy = req.user._id;
    if (!canEditNumber && data.householdNumber !== undefined) delete data.householdNumber;
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    if (data.dateAccomplished) data.dateAccomplished = new Date(data.dateAccomplished);
    Object.assign(record, data);
    await record.save();
    logActivity(req, { action: 'update', resource: 'formB', resourceId: record._id.toString() });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const filter = getListFilter(req);
    const record = await FormB.findOneAndDelete({ _id: req.params.id, ...filter });
    if (!record) return res.status(404).json({ message: 'Form B record not found' });
    logActivity(req, { action: 'delete', resource: 'formB', resourceId: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const certify = async (req, res) => {
  try {
    if (!canCertify.includes(req.user.role)) return res.status(403).json({ message: 'Only Secretary can certify' });
    const filter = getListFilter(req);
    const record = await FormB.findOne({ _id: req.params.id, ...filter });
    if (!record) return res.status(404).json({ message: 'Form B record not found' });
    if (record.status !== 'submitted') return res.status(400).json({ message: 'Only submitted records can be certified' });
    record.status = 'certified';
    record.certifiedBy = req.user._id;
    record.certifiedAt = new Date();
    record.lastModifiedBy = req.user._id;
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const validate = async (req, res) => {
  try {
    if (!canValidate.includes(req.user.role)) return res.status(403).json({ message: 'Only Punong Barangay can validate' });
    const filter = getListFilter(req);
    const record = await FormB.findOne({ _id: req.params.id, ...filter });
    if (!record) return res.status(404).json({ message: 'Form B record not found' });
    if (record.status !== 'certified') return res.status(400).json({ message: 'Only certified records can be validated' });
    record.status = 'validated';
    record.validatedBy = req.user._id;
    record.validatedAt = new Date();
    record.lastModifiedBy = req.user._id;
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submit = async (req, res) => {
  try {
    const filter = getListFilter(req);
    const record = await FormB.findOne({ _id: req.params.id, ...filter });
    if (!record) return res.status(404).json({ message: 'Form B record not found' });
    if (record.status !== 'draft') return res.status(400).json({ message: 'Only draft can be submitted' });
    record.status = 'submitted';
    record.preparedBy = req.body.preparedBy || req.user.fullName;
    record.preparedAt = new Date();
    record.lastModifiedBy = req.user._id;
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
