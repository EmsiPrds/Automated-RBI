import FormB from '../models/FormB.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const staffRoles = ['encoder', 'secretary', 'punong_barangay', 'viewer'];

function getListFilter(req) {
  const { user } = req;
  if (user.role === 'admin') return {};
  if (user.role === 'resident') return { createdBy: user._id };
  if (staffRoles.includes(user.role) && user.barangay) {
    const b = String(user.barangay).trim();
    if (b) return { barangay: new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
  }
  return {};
}

function formatDate(d) {
  if (!d) return '';
  const x = new Date(d);
  return isNaN(x.getTime()) ? '' : x.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

const FORM_B_CERTIFICATION =
  'I hereby certify that the above information is true and correct to the best of my knowledge. I understand that for the Barangay to carry out its mandate pursuant to Section 394 (d)(6) of the Local Government Code of 1991, they must necessarily process my personal information for easy identification of inhabitants, as a tool in planning, and as an updated reference in the number of inhabitants of the Barangay. Therefore, I grant my consent and recognize the authority of the Barangay to process my personal information, subject to the provision of the Philippine Data Privacy Act of 2012.';

const BLACK = rgb(0, 0, 0);
const EDU_OPTIONS = ['Elementary', 'High School', 'College', 'Post Grad', 'Vocational'];

export const generateFormBPdf = async (req, res) => {
  try {
    const filter = getListFilter(req);
    const record = await FormB.findOne({ _id: req.params.id, ...filter });
    if (!record) return res.status(404).json({ message: 'Form B record not found' });

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 40;
    let y = pageHeight - margin;

    const page = doc.addPage([pageWidth, pageHeight]);

    // Header
    page.drawText('RBI Form B (Revised 2024)', { x: margin, y, size: 11, font: bold, color: BLACK });
    y -= 14;
    const title = 'INDIVIDUAL RECORDS OF BARANGAY INHABITANT';
    const titleW = bold.widthOfTextAtSize(title, 12);
    page.drawText(title, { x: (pageWidth - titleW) / 2, y, size: 12, font: bold, color: BLACK });
    y -= 20;

    // Location: REGION / CITY/MUN, PROVINCE / BARANGAY
    const leftLabelX = margin;
    const rightLabelX = pageWidth / 2 + 10;
    const lineGap = 18;
    const lineLen = 140;
    const drawField = (label, value, xPos, yPos) => {
      page.drawText(label, { x: xPos, y: yPos, size: 9, font, color: BLACK });
      page.drawLine({ start: { x: xPos + 55, y: yPos - 8 }, end: { x: xPos + 55 + lineLen, y: yPos - 8 }, thickness: 0.5, color: BLACK });
      if (value) page.drawText(value, { x: xPos + 57, y: yPos - 10, size: 9, font, color: BLACK });
    };
    drawField('REGION :', record.region || '', leftLabelX, y);
    drawField('CITY/MUN :', record.cityMunicipality || '', rightLabelX, y);
    y -= lineGap;
    drawField('PROVINCE :', record.province || '', leftLabelX, y);
    drawField('BARANGAY :', record.barangay || '', rightLabelX, y);
    y -= 22;

    // PERSONAL INFORMATION (thick border)
    const boxLeft = margin;
    const boxRight = pageWidth - margin;
    const boxTop = y;
    page.drawRectangle({ x: boxLeft, y: y - 2, width: boxRight - boxLeft, height: 2, borderColor: BLACK, borderWidth: 2 });
    y -= 14;
    const piTitle = 'PERSONAL INFORMATION';
    const piTitleW = bold.widthOfTextAtSize(piTitle, 10);
    page.drawText(piTitle, { x: (pageWidth - piTitleW) / 2, y, size: 10, font: bold, color: BLACK });
    y -= 18;

    // PhilSys Card No. (full width box)
    page.drawText('(PhilSys Card No.)', { x: boxLeft, y: y + 4, size: 8, font, color: BLACK });
    page.drawRectangle({ x: boxLeft, y: y - 16, width: boxRight - boxLeft, height: 18, borderColor: BLACK, borderWidth: 0.5 });
    if (record.philSysCardNo) page.drawText(record.philSysCardNo, { x: boxLeft + 4, y: y - 12, size: 9, font, color: BLACK });
    y -= 24;

    // Name row: (Last Name) (Suffix) (First Name) (Middle Name)
    const nameW1 = (boxRight - boxLeft - 12) * 0.28;
    const nameW2 = (boxRight - boxLeft - 12) * 0.12;
    const nameW3 = (boxRight - boxLeft - 12) * 0.32;
    const nameW4 = (boxRight - boxLeft - 12) * 0.28;
    let nx = boxLeft;
    page.drawText('(Last Name)', { x: nx, y: y + 4, size: 7, font, color: BLACK });
    page.drawLine({ start: { x: nx, y: y - 8 }, end: { x: nx + nameW1, y: y - 8 }, thickness: 0.5, color: BLACK });
    if (record.lastName) page.drawText(record.lastName.substring(0, 25), { x: nx + 2, y: y - 10, size: 8, font, color: BLACK });
    nx += nameW1 + 4;
    page.drawText('(Suffix, e.g., Jr., I, II, III)', { x: nx, y: y + 4, size: 6, font, color: BLACK });
    page.drawLine({ start: { x: nx, y: y - 8 }, end: { x: nx + nameW2, y: y - 8 }, thickness: 0.5, color: BLACK });
    if (record.nameExtension) page.drawText(record.nameExtension.substring(0, 8), { x: nx + 2, y: y - 10, size: 8, font, color: BLACK });
    nx += nameW2 + 4;
    page.drawText('(First Name)', { x: nx, y: y + 4, size: 7, font, color: BLACK });
    page.drawLine({ start: { x: nx, y: y - 8 }, end: { x: nx + nameW3, y: y - 8 }, thickness: 0.5, color: BLACK });
    if (record.firstName) page.drawText(record.firstName.substring(0, 28), { x: nx + 2, y: y - 10, size: 8, font, color: BLACK });
    nx += nameW3 + 4;
    page.drawText('(Middle Name)', { x: nx, y: y + 4, size: 7, font, color: BLACK });
    page.drawLine({ start: { x: nx, y: y - 8 }, end: { x: nx + nameW4, y: y - 8 }, thickness: 0.5, color: BLACK });
    if (record.middleName) page.drawText(record.middleName.substring(0, 25), { x: nx + 2, y: y - 10, size: 8, font, color: BLACK });
    y -= 22;

    // Row: (Birth Date) (Birth Place) (Sex) (Civil Status) (Religion)
    const r1w = 75;
    const r1gap = 8;
    let rx = boxLeft;
    const labels1 = ['(Birth Date: mm/dd/yyyy)', '(Birth Place)', '(Sex)', '(Civil Status)', '(Religion)'];
    const vals1 = [
      record.dateOfBirth ? formatDate(record.dateOfBirth) : '',
      (record.placeOfBirth || '').substring(0, 18),
      (record.sex || '').substring(0, 8),
      (record.civilStatus || '').substring(0, 12),
      (record.religion || '').substring(0, 15),
    ];
    for (let i = 0; i < 5; i++) {
      const w = i === 1 ? 95 : r1w;
      page.drawText(labels1[i], { x: rx, y: y + 4, size: 6, font, color: BLACK });
      page.drawLine({ start: { x: rx, y: y - 8 }, end: { x: rx + w, y: y - 8 }, thickness: 0.5, color: BLACK });
      if (vals1[i]) page.drawText(vals1[i], { x: rx + 2, y: y - 10, size: 7, font, color: BLACK });
      rx += w + r1gap;
    }
    y -= 22;

    // (Residence Address) (Citizenship)
    const addrW = (boxRight - boxLeft - 8) / 2;
    page.drawText('(Residence Address)', { x: boxLeft, y: y + 4, size: 7, font, color: BLACK });
    page.drawLine({ start: { x: boxLeft, y: y - 8 }, end: { x: boxLeft + addrW, y: y - 8 }, thickness: 0.5, color: BLACK });
    if (record.residenceAddress) page.drawText(record.residenceAddress.substring(0, 45), { x: boxLeft + 2, y: y - 10, size: 8, font, color: BLACK });
    page.drawText('(Citizenship)', { x: boxLeft + addrW + 8, y: y + 4, size: 7, font, color: BLACK });
    page.drawLine({ start: { x: boxLeft + addrW + 8, y: y - 8 }, end: { x: boxRight - 2, y: y - 8 }, thickness: 0.5, color: BLACK });
    if (record.citizenship) page.drawText(record.citizenship.substring(0, 25), { x: boxLeft + addrW + 10, y: y - 10, size: 8, font, color: BLACK });
    y -= 22;

    // (Profession/Occupation) (Contact Number) (E-mail Address)
    const cw = (boxRight - boxLeft - 16) / 3;
    rx = boxLeft;
    page.drawText('(Profession / Occupation)', { x: rx, y: y + 4, size: 6, font, color: BLACK });
    page.drawLine({ start: { x: rx, y: y - 8 }, end: { x: rx + cw, y: y - 8 }, thickness: 0.5, color: BLACK });
    if (record.occupation) page.drawText(record.occupation.substring(0, 22), { x: rx + 2, y: y - 10, size: 8, font, color: BLACK });
    rx += cw + 8;
    page.drawText('(Contact Number)', { x: rx, y: y + 4, size: 6, font, color: BLACK });
    page.drawLine({ start: { x: rx, y: y - 8 }, end: { x: rx + cw, y: y - 8 }, thickness: 0.5, color: BLACK });
    if (record.contactNumber) page.drawText(record.contactNumber.substring(0, 22), { x: rx + 2, y: y - 10, size: 8, font, color: BLACK });
    rx += cw + 8;
    page.drawText('(E-mail Address)', { x: rx, y: y + 4, size: 6, font, color: BLACK });
    page.drawLine({ start: { x: rx, y: y - 8 }, end: { x: rx + cw, y: y - 8 }, thickness: 0.5, color: BLACK });
    if (record.email) page.drawText(record.email.substring(0, 28), { x: rx + 2, y: y - 10, size: 7, font, color: BLACK });
    y -= 28;

    // Close PERSONAL INFORMATION box (sides and bottom)
    page.drawRectangle({ x: boxLeft, y: y - 2, width: 2, height: boxTop - y + 4, borderColor: BLACK, borderWidth: 1.5 });
    page.drawRectangle({ x: boxRight - 2, y: y - 2, width: 2, height: boxTop - y + 4, borderColor: BLACK, borderWidth: 1.5 });
    page.drawRectangle({ x: boxLeft, y: y - 2, width: boxRight - boxLeft, height: 2, borderColor: BLACK, borderWidth: 1.5 });
    y -= 16;

    // HIGHEST EDUCATIONAL ATTAINMENT
    page.drawText('HIGHEST EDUCATIONAL ATTAINMENT:', { x: boxLeft, y, size: 9, font: bold, color: BLACK });
    y -= 14;
    const cbSize = 10;
    const cbGap = 4;
    rx = boxLeft;
    for (const opt of EDU_OPTIONS) {
      page.drawRectangle({ x: rx, y: y - cbSize, width: cbSize, height: cbSize, borderColor: BLACK, borderWidth: 0.5 });
      if (record.highestEducationalAttainment && record.highestEducationalAttainment.toLowerCase() === opt.toLowerCase()) {
        page.drawText('✓', { x: rx + 2, y: y - cbSize + 1, size: 8, font: bold, color: BLACK });
      }
      page.drawText(opt, { x: rx + cbSize + cbGap, y: y - cbSize + 2, size: 8, font, color: BLACK });
      rx += cbSize + cbGap + font.widthOfTextAtSize(opt, 8) + 18;
    }
    y -= 20;
    page.drawText('Please specify:', { x: boxLeft, y, size: 8, font, color: BLACK });
    rx = boxLeft + 75;
    page.drawRectangle({ x: rx, y: y - cbSize, width: cbSize, height: cbSize, borderColor: BLACK, borderWidth: 0.5 });
    if (record.graduateOrUndergraduate === 'Graduate') page.drawText('✓', { x: rx + 2, y: y - cbSize + 1, size: 8, font: bold, color: BLACK });
    page.drawText('Graduate', { x: rx + cbSize + cbGap, y: y - cbSize + 2, size: 8, font, color: BLACK });
    rx += 55;
    page.drawRectangle({ x: rx, y: y - cbSize, width: cbSize, height: cbSize, borderColor: BLACK, borderWidth: 0.5 });
    if (record.graduateOrUndergraduate === 'Under Graduate') page.drawText('✓', { x: rx + 2, y: y - cbSize + 1, size: 8, font: bold, color: BLACK });
    page.drawText('Under Graduate', { x: rx + cbSize + cbGap, y: y - cbSize + 2, size: 8, font, color: BLACK });
    y -= 28;

    // Certification paragraph (wrapped)
    const certLines = [];
    let rem = FORM_B_CERTIFICATION;
    const maxLen = 92;
    while (rem.length > 0) {
      if (rem.length <= maxLen) {
        certLines.push(rem);
        break;
      }
      let br = rem.lastIndexOf(' ', maxLen);
      if (br <= 0) br = maxLen;
      certLines.push(rem.substring(0, br));
      rem = rem.substring(br).trim();
    }
    for (const line of certLines) {
      page.drawText(line, { x: boxLeft, y, size: 6, font, color: BLACK });
      y -= 7;
    }
    y -= 12;

    // Date Accomplished / Name-Signature of Person Accomplishing
    page.drawText('Date Accomplished', { x: boxLeft, y, size: 8, font, color: BLACK });
    page.drawLine({ start: { x: boxLeft, y: y - 12 }, end: { x: boxLeft + 100, y: y - 12 }, thickness: 0.5, color: BLACK });
    if (record.dateAccomplished) page.drawText(formatDate(record.dateAccomplished), { x: boxLeft + 2, y: y - 14, size: 8, font, color: BLACK });
    const sigLabel = 'Name/Signature of Person Accomplishing the Form';
    const sigLabelW = font.widthOfTextAtSize(sigLabel, 8);
    page.drawText(sigLabel, { x: pageWidth - margin - 180 - sigLabelW / 2, y, size: 8, font, color: BLACK });
    page.drawLine({ start: { x: pageWidth - margin - 180, y: y - 12 }, end: { x: pageWidth - margin, y: y - 12 }, thickness: 0.5, color: BLACK });
    if (record.preparedBy) page.drawText(record.preparedBy.substring(0, 35), { x: pageWidth - margin - 178, y: y - 14, size: 7, font, color: BLACK });
    y -= 28;

    // Attested By: Barangay Secretary | Left Thumbmark | Right Thumbmark
    page.drawText('Attested By:', { x: boxLeft, y, size: 8, font: bold, color: BLACK });
    page.drawText('Barangay Secretary', { x: boxLeft, y: y - 12, size: 8, font, color: BLACK });
    page.drawLine({ start: { x: boxLeft, y: y - 24 }, end: { x: boxLeft + 140, y: y - 24 }, thickness: 0.5, color: BLACK });
    const thumbSize = 28;
    const thumbY = y - 20;
    const leftThumbX = pageWidth - margin - 180 - thumbSize - 20;
    const rightThumbX = pageWidth - margin - thumbSize;
    page.drawRectangle({ x: leftThumbX, y: thumbY - thumbSize, width: thumbSize, height: thumbSize, borderColor: BLACK, borderWidth: 0.5 });
    page.drawText('Left Thumbmark', { x: leftThumbX - 8, y: thumbY - thumbSize - 12, size: 6, font, color: BLACK });
    page.drawRectangle({ x: rightThumbX, y: thumbY - thumbSize, width: thumbSize, height: thumbSize, borderColor: BLACK, borderWidth: 0.5 });
    page.drawText('Right Thumbmark', { x: rightThumbX - 4, y: thumbY - thumbSize - 12, size: 6, font, color: BLACK });
    y = thumbY - thumbSize - 24;

    // Household Number
    page.drawText('Household Number:', { x: boxLeft, y, size: 9, font, color: BLACK });
    page.drawLine({ start: { x: boxLeft + 95, y: y - 10 }, end: { x: boxLeft + 95 + 120, y: y - 10 }, thickness: 0.5, color: BLACK });
    if (record.householdNumber) page.drawText(record.householdNumber, { x: boxLeft + 97, y: y - 12, size: 9, font, color: BLACK });
    page.drawText('Note: The household number shall be filled up by the Barangay Secretary.', { x: boxLeft, y: y - 22, size: 6, font, color: BLACK });

    const pdfBytes = await doc.save();
    const safeName = [record.lastName, record.firstName].filter(Boolean).join('-').replace(/\s+/g, '-') || record._id.toString();
    const filename = `RBI-Form-B-${safeName}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
