import Household from '../models/Household.js';
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
  return isNaN(x.getTime()) ? '' : x.toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');
}

function statusLabels(inv) {
  const parts = [];
  if (inv.isLaborEmployed) parts.push('Labor/employed');
  if (inv.isUnemployed) parts.push('Unemployed');
  if (inv.isPWD) parts.push('PWD');
  if (inv.isOFW) parts.push('OFW');
  if (inv.isSoloParent) parts.push('Solo Parent');
  if (inv.isOSY) parts.push('OSY');
  if (inv.isOSC) parts.push('OSC');
  if (inv.isIP) parts.push('IP');
  return parts.join(', ') || '';
}

const FORM_A_DISCLAIMER =
  'I hereby certify that the above information are true and correct to the best of my knowledge. I understand that for the Barangay to carry out its mandate pursuant to Section 394 (b)(5) of the Local Government Code of 1991, they must necessarily process my personal information for easy identification of inhabitants, as a tool in planning, and as an updated reference in the number of inhabitants of the Barangay. Therefore, I grant my consent and recognize the authority of the Barangay to process my personal information, subject to the provision of the Philippine Data Privacy Act of 2012.';

const LIGHT_GREEN = rgb(0.85, 0.95, 0.85);
const BLACK = rgb(0, 0, 0);

export const generateFormAPdf = async (req, res) => {
  try {
    const filter = getListFilter(req);
    const household = await Household.findOne({ _id: req.params.id, ...filter });
    if (!household) return res.status(404).json({ message: 'Household not found' });

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 36;
    let y = pageHeight - margin;

    const drawText = (text, x, yPos, size = 10, useBold = false) => {
      const f = useBold ? bold : font;
      const tw = f.widthOfTextAtSize(text, size);
      page.drawText(text, { x, y: yPos, size, font: f, color: BLACK });
      return { width: tw, height: size };
    };

    const page = doc.addPage([pageWidth, pageHeight]);

    // Title left
    drawText('RBI FORM A (Revised 2024)', margin, y, 11, true);
    y -= 14;

    // Subtitle centered
    const subtitle = 'RECORDS OF BARANGAY INHABITANTS BY HOUSEHOLD';
    const subW = bold.widthOfTextAtSize(subtitle, 12);
    page.drawText(subtitle, { x: (pageWidth - subW) / 2, y, size: 12, font: bold, color: BLACK });
    y -= 24;

    // Household info block (labels + lines)
    const labelW = 130;
    const lineStart = margin + labelW + 4;
    const lineEnd = margin + 220;
    const lineY = (ly) => {
      page.drawLine({ start: { x: lineStart, y: ly }, end: { x: lineEnd, y: ly }, thickness: 0.5, color: BLACK });
    };
    const fields = [
      ['REGION:', household.region || ''],
      ['PROVINCE:', household.province || ''],
      ['CITY/MUNICIPALITY:', household.cityMunicipality || ''],
      ['BARANGAY:', household.barangay || ''],
      ['HOUSEHOLD ADDRESS:', household.householdAddress || ''],
      ['NO. OF HOUSEHOLD MEMBERS:', String(household.numberOfMembers ?? household.inhabitants?.length ?? 0)],
    ];
    for (const [label, value] of fields) {
      page.drawText(label, { x: margin, y, size: 9, font, color: BLACK });
      if (value) page.drawText(value, { x: lineStart + 2, y: y - 1, size: 9, font, color: BLACK });
      lineY(y - 10);
      y -= 18;
    }
    y -= 8;

    // Table: NAME merged header (light green) then column headers
    const tableLeft = margin;
    const tableRight = pageWidth - margin;
    const tableW = tableRight - tableLeft;
    const colWidths = [50, 48, 45, 22, 52, 42, 18, 22, 42, 38, 45]; // last name, first, middle, ext, place birth, date birth, age, sex, civil, citizenship, occupation
    const statusColW = tableW - colWidths.reduce((a, b) => a + b, 0) - 2;
    const rowH = 16;
    const headerH = 14;
    const nameHeaderH = 12;

    let x = tableLeft;
    // Merged NAME cell (spans first 4 columns)
    const nameSpanW = colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3];
    page.drawRectangle({ x, y: y - nameHeaderH, width: nameSpanW, height: nameHeaderH, color: LIGHT_GREEN });
    page.drawRectangle({ x, y: y - nameHeaderH, width: nameSpanW, height: nameHeaderH, borderColor: BLACK, borderWidth: 0.5 });
    page.drawText('NAME', { x: x + 4, y: y - nameHeaderH + 3, size: 8, font: bold, color: BLACK });
    x += nameSpanW;
    page.drawRectangle({ x, y: y - nameHeaderH, width: tableW - nameSpanW, height: nameHeaderH, color: LIGHT_GREEN });
    page.drawRectangle({ x, y: y - nameHeaderH, width: tableW - nameSpanW, height: nameHeaderH, borderColor: BLACK, borderWidth: 0.5 });
    x = tableLeft;
    y -= nameHeaderH;

    // Column headers row
    const colHeaders = ['LAST NAME', 'FIRST NAME', 'MIDDLE NAME', 'EXT', 'PLACE OF BIRTH', 'DATE OF BIRTH', 'AGE', 'SEX', 'CIVIL STATUS', 'CITIZENSHIP', 'OCCUPATION'];
    page.drawRectangle({ x: tableLeft, y: y - headerH, width: tableW - statusColW, height: headerH, color: LIGHT_GREEN });
    page.drawRectangle({ x: tableLeft, y: y - headerH, width: tableW - statusColW, height: headerH, borderColor: BLACK, borderWidth: 0.5 });
    let cx = tableLeft;
    for (let i = 0; i < colHeaders.length; i++) {
      const w = colWidths[i];
      const txt = colHeaders[i];
      if (font.widthOfTextAtSize(txt, 6) > w - 4) {
        page.drawText(txt.substring(0, 8), { x: cx + 2, y: y - headerH + 4, size: 6, font: bold, color: BLACK });
      } else {
        page.drawText(txt, { x: cx + 2, y: y - headerH + 4, size: 6, font: bold, color: BLACK });
      }
      cx += w;
    }
    page.drawRectangle({ x: tableLeft + tableW - statusColW, y: y - headerH, width: statusColW, height: headerH, color: LIGHT_GREEN });
    page.drawRectangle({ x: tableLeft + tableW - statusColW, y: y - headerH, width: statusColW, height: headerH, borderColor: BLACK, borderWidth: 0.5 });
    const statusHeaderText = 'Indicate if Labor/employed, Unemployed, PWD, OFW, Solo Parent, OSY, OSC and/or IP';
    // Wrap long text into two lines
    page.drawText('Indicate if Labor/employed, Unemployed,', { x: tableLeft + tableW - statusColW + 2, y: y - headerH + 7, size: 5, font: bold, color: BLACK });
    page.drawText('PWD, OFW, Solo Parent, OSY, OSC and/or IP', { x: tableLeft + tableW - statusColW + 2, y: y - headerH + 2, size: 5, font: bold, color: BLACK });
    y -= headerH;

    const inhabitants = household.inhabitants || [];
    const ROWS_PER_PAGE = 10;
    let rowIndex = 0;

    const drawDataRow = (inv) => {
      page.drawRectangle({ x: tableLeft, y: y - rowH, width: tableW, height: rowH, borderColor: BLACK, borderWidth: 0.5 });
      const vals = [
        (inv.lastName || '').substring(0, 18),
        (inv.firstName || '').substring(0, 18),
        (inv.middleName || '').substring(0, 14),
        (inv.nameExtension || '').substring(0, 4),
        (inv.placeOfBirth || '').substring(0, 20),
        inv.dateOfBirth ? formatDate(inv.dateOfBirth) : '',
        inv.age != null ? String(inv.age) : '',
        (inv.sex || '').substring(0, 6),
        (inv.civilStatus || '').substring(0, 10),
        (inv.citizenship || '').substring(0, 10),
        (inv.occupation || '').substring(0, 14),
      ];
      cx = tableLeft;
      for (let i = 0; i < vals.length; i++) {
        const v = vals[i];
        if (v) page.drawText(v, { x: cx + 2, y: y - rowH + 4, size: 7, font, color: BLACK });
        cx += colWidths[i];
      }
      const statusStr = statusLabels(inv);
      if (statusStr) page.drawText(statusStr.substring(0, 35), { x: tableLeft + tableW - statusColW + 2, y: y - rowH + 4, size: 6, font, color: BLACK });
      y -= rowH;
    };

    for (let i = 0; i < Math.min(inhabitants.length, ROWS_PER_PAGE); i++) {
      drawDataRow(inhabitants[i]);
      rowIndex++;
    }
    // Empty rows up to 10
    for (let i = inhabitants.length; i < ROWS_PER_PAGE; i++) {
      page.drawRectangle({ x: tableLeft, y: y - rowH, width: tableW, height: rowH, borderColor: BLACK, borderWidth: 0.5 });
      y -= rowH;
    }

    y -= 16;

    // Footer: Prepared by, Certified Correct, Validated by
    const footBlockW = (tableW - 24) / 3;
    const sigY = y;
    const sigLineY = y - 12;
    const labelY = y - 24;

    page.drawText('Prepared by:', { x: tableLeft, y: sigY, size: 9, font: bold, color: BLACK });
    page.drawLine({ start: { x: tableLeft, y: sigLineY }, end: { x: tableLeft + footBlockW - 8, y: sigLineY }, thickness: 0.5, color: BLACK });
    page.drawText('Name of Household/Head Member', { x: tableLeft, y: labelY, size: 7, font, color: BLACK });
    page.drawText('(Signature over Printed Name)', { x: tableLeft, y: labelY - 10, size: 6, font, color: BLACK });

    const midX = tableLeft + footBlockW + 12;
    page.drawText('Certified Correct:', { x: midX, y: sigY, size: 9, font: bold, color: BLACK });
    page.drawLine({ start: { x: midX, y: sigLineY }, end: { x: midX + footBlockW - 8, y: sigLineY }, thickness: 0.5, color: BLACK });
    page.drawText('Barangay Secretary', { x: midX, y: labelY, size: 7, font, color: BLACK });
    page.drawText('(Signature over Printed Name)', { x: midX, y: labelY - 10, size: 6, font, color: BLACK });

    const rightX = tableLeft + (footBlockW + 12) * 2;
    page.drawText('Validated by:', { x: rightX, y: sigY, size: 9, font: bold, color: BLACK });
    page.drawLine({ start: { x: rightX, y: sigLineY }, end: { x: rightX + footBlockW - 8, y: sigLineY }, thickness: 0.5, color: BLACK });
    page.drawText('Punong Barangay', { x: rightX, y: labelY, size: 7, font, color: BLACK });
    page.drawText('(Signature over Printed Name)', { x: rightX, y: labelY - 10, size: 6, font, color: BLACK });

    y = labelY - 28;

    // Disclaimer (small font, wrapped)
    const disclaimerLines = [];
    const maxCharsPerLine = 100;
    let remaining = FORM_A_DISCLAIMER;
    while (remaining.length > 0) {
      if (remaining.length <= maxCharsPerLine) {
        disclaimerLines.push(remaining);
        break;
      }
      let breakAt = remaining.lastIndexOf(' ', maxCharsPerLine);
      if (breakAt <= 0) breakAt = maxCharsPerLine;
      disclaimerLines.push(remaining.substring(0, breakAt));
      remaining = remaining.substring(breakAt).trim();
    }
    for (const line of disclaimerLines) {
      page.drawText(line, { x: margin, y, size: 6, font, color: BLACK });
      y -= 8;
    }

    // If more than 10 inhabitants, add continuation pages
    if (inhabitants.length > ROWS_PER_PAGE) {
      let offset = ROWS_PER_PAGE;
      while (offset < inhabitants.length) {
        const nextPage = doc.addPage([pageWidth, pageHeight]);
        let py = pageHeight - margin;
        nextPage.drawText('RBI FORM A (Revised 2024) - Continuation', { x: margin, y: py, size: 10, font: bold, color: BLACK });
        py -= 16;
        nextPage.drawRectangle({ x: tableLeft, y: py - nameHeaderH, width: tableW, height: nameHeaderH, color: LIGHT_GREEN });
        nextPage.drawRectangle({ x: tableLeft, y: py - nameHeaderH, width: tableW, height: nameHeaderH, borderColor: BLACK, borderWidth: 0.5 });
        nextPage.drawText('NAME', { x: tableLeft + 4, y: py - nameHeaderH + 3, size: 8, font: bold, color: BLACK });
        py -= nameHeaderH;
        nextPage.drawRectangle({ x: tableLeft, y: py - headerH, width: tableW, height: headerH, color: LIGHT_GREEN });
        nextPage.drawRectangle({ x: tableLeft, y: py - headerH, width: tableW, height: headerH, borderColor: BLACK, borderWidth: 0.5 });
        py -= headerH;
        const end = Math.min(offset + ROWS_PER_PAGE, inhabitants.length);
        for (let i = offset; i < end; i++) {
          nextPage.drawRectangle({ x: tableLeft, y: py - rowH, width: tableW, height: rowH, borderColor: BLACK, borderWidth: 0.5 });
          const inv = inhabitants[i];
          const vals = [
            (inv.lastName || '').substring(0, 18),
            (inv.firstName || '').substring(0, 18),
            (inv.middleName || '').substring(0, 14),
            (inv.nameExtension || '').substring(0, 4),
            (inv.placeOfBirth || '').substring(0, 20),
            inv.dateOfBirth ? formatDate(inv.dateOfBirth) : '',
            inv.age != null ? String(inv.age) : '',
            (inv.sex || '').substring(0, 6),
            (inv.civilStatus || '').substring(0, 10),
            (inv.citizenship || '').substring(0, 10),
            (inv.occupation || '').substring(0, 14),
          ];
          let nx = tableLeft;
          for (let j = 0; j < vals.length; j++) {
            if (vals[j]) nextPage.drawText(vals[j], { x: nx + 2, y: py - rowH + 4, size: 7, font, color: BLACK });
            nx += colWidths[j];
          }
          const statusStr = statusLabels(inv);
          if (statusStr) nextPage.drawText(statusStr.substring(0, 35), { x: tableLeft + tableW - statusColW + 2, y: py - rowH + 4, size: 6, font, color: BLACK });
          py -= rowH;
        }
        offset = end;
      }
    }

    const pdfBytes = await doc.save();
    const filename = `RBI-Form-A-${(household.householdNumber || household._id.toString()).replace(/\s+/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
