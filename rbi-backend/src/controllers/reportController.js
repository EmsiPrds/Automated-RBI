import Household from '../models/Household.js';
import FormB from '../models/FormB.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ExcelJS from 'exceljs';

const staffRoles = ['encoder', 'secretary', 'punong_barangay', 'viewer'];
const SENIOR_AGE = 60;

function getAge(inv) {
  if (inv.age != null && inv.age !== '') return Number(inv.age);
  if (inv.dateOfBirth) {
    const d = new Date(inv.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
    return age;
  }
  return null;
}

function getAgeGroup(age) {
  if (age == null || age < 0) return null;
  if (age <= 17) return '0-17';
  if (age <= 59) return '18-59';
  return '60+';
}

function getBarangayFilter(req) {
  const { user } = req;
  if (user.role === 'admin') return {};
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
      bySex: { male: 0, female: 0, other: 0 },
      byAgeGroup: { '0-17': 0, '18-59': 0, '60+': 0 },
      seniorCount: 0,
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
        const sex = (inv.sex || '').toLowerCase();
        if (sex === 'male') counts.bySex.male++;
        else if (sex === 'female') counts.bySex.female++;
        else if (inv.sex) counts.bySex.other++;
        const age = getAge(inv);
        const ag = getAgeGroup(age);
        if (ag) counts.byAgeGroup[ag]++;
        if (age !== null && age >= SENIOR_AGE) counts.seniorCount++;
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

/** Dashboard: stats + recent registrations for encoder/secretary/punong_barangay */
export const dashboard = async (req, res) => {
  try {
    const baseFilter = getBarangayFilter(req);
    if (baseFilter === null) return res.status(403).json({ message: 'Residents cannot access dashboard stats' });
    const filter = { ...baseFilter };

    const households = await Household.find(filter).sort({ createdAt: -1 });
    let totalInhabitants = 0;
    const bySex = { male: 0, female: 0, other: 0 };

    for (const h of households) {
      for (const inv of h.inhabitants || []) {
        totalInhabitants++;
        const sex = (inv.sex || '').toLowerCase();
        if (sex === 'male') bySex.male++;
        else if (sex === 'female') bySex.female++;
        else if (inv.sex) bySex.other++;
      }
    }

    const recentHouseholds = households.slice(0, 10).map((h) => ({
      _id: h._id,
      householdNumber: h.householdNumber,
      householdAddress: h.householdAddress,
      numberOfMembers: (h.inhabitants || []).length,
      createdAt: h.createdAt,
    }));

    res.json({
      totalHouseholds: households.length,
      totalInhabitants,
      bySex,
      recentRegistrations: recentHouseholds,
    });
  } catch (err) {
    console.error('GET /api/reports/dashboard', err.message || err);
    res.status(500).json({ message: err.message });
  }
};

/** Senior citizens list (age 60+) from Form B */
export const seniorCitizens = async (req, res) => {
  try {
    const baseFilter = getBarangayFilter(req);
    if (baseFilter === null) return res.status(403).json({ message: 'Residents cannot access reports' });
    const { barangay } = req.query;
    const filter = { ...baseFilter };
    if (barangay) filter.barangay = barangay;

    const records = await FormB.find(filter);
    const list = [];
    const today = new Date();
    for (const r of records) {
      let age = r.age;
      if (age == null && r.dateOfBirth) {
        const d = new Date(r.dateOfBirth);
        age = today.getFullYear() - d.getFullYear();
        if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
      }
      if (age != null && age >= SENIOR_AGE) {
        list.push({
          _id: r._id,
          lastName: r.lastName,
          firstName: r.firstName,
          middleName: r.middleName,
          nameExtension: r.nameExtension,
          dateOfBirth: r.dateOfBirth,
          age,
          sex: r.sex,
          residenceAddress: r.residenceAddress,
          barangay: r.barangay,
          contactNumber: r.contactNumber,
        });
      }
    }
    res.json({ list, total: list.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** PWD list from Form B */
export const pwdList = async (req, res) => {
  try {
    const baseFilter = getBarangayFilter(req);
    if (baseFilter === null) return res.status(403).json({ message: 'Residents cannot access reports' });
    const { barangay } = req.query;
    const filter = { ...baseFilter, isPWD: true };
    if (barangay) filter.barangay = barangay;

    const records = await FormB.find(filter).select('lastName firstName middleName nameExtension dateOfBirth age sex residenceAddress barangay contactNumber');
    const list = records.map((r) => ({
      _id: r._id,
      lastName: r.lastName,
      firstName: r.firstName,
      middleName: r.middleName,
      nameExtension: r.nameExtension,
      dateOfBirth: r.dateOfBirth,
      age: r.age,
      sex: r.sex,
      residenceAddress: r.residenceAddress,
      barangay: r.barangay,
      contactNumber: r.contactNumber,
    }));
    res.json({ list, total: list.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Export report as PDF */
export const exportPdf = async (req, res) => {
  try {
    const baseFilter = getBarangayFilter(req);
    if (baseFilter === null) return res.status(403).json({ message: 'Residents cannot access reports' });
    const filter = { ...baseFilter };
    const households = await Household.find(filter);
    let totalInhabitants = 0;
    const bySex = { male: 0, female: 0, other: 0 };
    const byAgeGroup = { '0-17': 0, '18-59': 0, '60+': 0 };
    for (const h of households) {
      for (const inv of h.inhabitants || []) {
        totalInhabitants++;
        const sex = (inv.sex || '').toLowerCase();
        if (sex === 'male') bySex.male++;
        else if (sex === 'female') bySex.female++;
        else if (inv.sex) bySex.other++;
        const age = getAge(inv);
        const ag = getAgeGroup(age);
        if (ag) byAgeGroup[ag]++;
      }
    }

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    let y = 750;
    const line = (text, useBold = false) => {
      doc.page.drawText(text, { x: 50, y, size: 10, font: useBold ? bold : font, color: rgb(0, 0, 0) });
      y -= 14;
    };
    line('RBI Report - Summary', true);
    line('');
    line(`Total Households: ${households.length}`);
    line(`Total Residents: ${totalInhabitants}`);
    line(`By Gender - Male: ${bySex.male}, Female: ${bySex.female}, Other: ${bySex.other}`);
    line(`By Age - 0-17: ${byAgeGroup['0-17']}, 18-59: ${byAgeGroup['18-59']}, 60+: ${byAgeGroup['60+']}`);
    const pdfBytes = await doc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="rbi-report.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Export report as Excel */
export const exportExcel = async (req, res) => {
  try {
    const baseFilter = getBarangayFilter(req);
    if (baseFilter === null) return res.status(403).json({ message: 'Residents cannot access reports' });
    const { barangay } = req.query;
    const filter = { ...baseFilter };
    if (barangay) filter.barangay = barangay;
    const households = await Household.find(filter);
    let totalInhabitants = 0;
    const bySex = { male: 0, female: 0, other: 0 };
    const byAgeGroup = { '0-17': 0, '18-59': 0, '60+': 0 };
    const byStatus = { draft: 0, submitted: 0, certified: 0, validated: 0 };
    for (const h of households) {
      byStatus[h.status] = (byStatus[h.status] || 0) + 1;
      for (const inv of h.inhabitants || []) {
        totalInhabitants++;
        const sex = (inv.sex || '').toLowerCase();
        if (sex === 'male') bySex.male++;
        else if (sex === 'female') bySex.female++;
        else if (inv.sex) bySex.other++;
        const age = getAge(inv);
        const ag = getAgeGroup(age);
        if (ag) byAgeGroup[ag]++;
      }
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Summary');
    ws.columns = [
      { header: 'Metric', width: 25 },
      { header: 'Value', width: 15 },
    ];
    ws.addRow(['Total Households', households.length]);
    ws.addRow(['Total Residents', totalInhabitants]);
    ws.addRow(['Male', bySex.male]);
    ws.addRow(['Female', bySex.female]);
    ws.addRow(['Other', bySex.other]);
    ws.addRow(['Age 0-17', byAgeGroup['0-17']]);
    ws.addRow(['Age 18-59', byAgeGroup['18-59']]);
    ws.addRow(['Age 60+', byAgeGroup['60+']]);
    ws.addRow(['Draft', byStatus.draft]);
    ws.addRow(['Submitted', byStatus.submitted]);
    ws.addRow(['Certified', byStatus.certified]);
    ws.addRow(['Validated', byStatus.validated]);
    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="rbi-report.xlsx"');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
