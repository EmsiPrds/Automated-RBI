import FormB from '../models/FormB.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { logActivity } from '../utils/activityLogger.js';

const staffRoles = ['encoder', 'secretary', 'punong_barangay', 'viewer'];
const CERT_TYPES = ['clearance', 'residency', 'indigency', 'good-moral'];

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

function fullName(r) {
  return [r.lastName, r.firstName, r.middleName, r.nameExtension].filter(Boolean).join(' ') || '';
}

function formatDate(d) {
  if (!d) return '';
  const x = new Date(d);
  return isNaN(x.getTime()) ? '' : x.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

export const generate = async (req, res) => {
  try {
    const { type } = req.params;
    const { residentId } = req.query;
    if (!CERT_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Invalid certificate type. Use: clearance, residency, indigency, good-moral' });
    }
    if (!residentId) return res.status(400).json({ message: 'residentId is required' });

    const filter = getListFilter(req);
    const resident = await FormB.findOne({ _id: residentId, ...filter });
    if (!resident) return res.status(404).json({ message: 'Resident record not found' });

    const name = fullName(resident);
    const address = resident.residenceAddress || '';
    const barangay = resident.barangay || 'Barangay';
    const today = formatDate(new Date());
    const citizenship = resident.citizenship || 'Filipino';
    const civilStatus = resident.civilStatus || '';
    const occupation = resident.occupation || '';

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const page = doc.addPage([612, 792]);
    let y = 750;
    const line = (text, size = 11, useBold = false) => {
      const lines = text.split('\n');
      for (const t of lines) {
        page.drawText(t, { x: 50, y, size, font: useBold ? bold : font, color: rgb(0, 0, 0) });
        y -= size + 2;
      }
    };

    line('OFFICIAL BARANGAY CERTIFICATE', 14, true);
    line('');
    if (type === 'clearance') {
      line('BARANGAY CLEARANCE', 12, true);
      line('');
      line(`To whom it may concern:`);
      line('');
      line(`This is to certify that ${name}, of legal age, ${civilStatus ? civilStatus.toLowerCase() : 'a resident'}, ${citizenship}, and a resident of ${address}, ${barangay}, has been cleared of any derogatory record in this Barangay as of ${today}.`);
      line('');
      line(`This certification is issued for whatever legal purpose it may serve.`);
    } else if (type === 'residency') {
      line('CERTIFICATE OF RESIDENCY', 12, true);
      line('');
      line(`To whom it may concern:`);
      line('');
      line(`This is to certify that ${name}, of legal age, is a bonafide resident of ${address}, ${barangay}.`);
      line('');
      line(`This certification is issued upon the request of the above-named person for whatever legal purpose it may serve.`);
    } else if (type === 'indigency') {
      line('CERTIFICATE OF INDIGENCY', 12, true);
      line('');
      line(`To whom it may concern:`);
      line('');
      line(`This is to certify that ${name}, of legal age, a resident of ${address}, ${barangay}, belongs to an indigent family and has requested assistance from this Barangay.`);
      line('');
      line(`This certification is issued for whatever legal purpose it may serve.`);
    } else {
      line('CERTIFICATE OF GOOD MORAL CHARACTER', 12, true);
      line('');
      line(`To whom it may concern:`);
      line('');
      line(`This is to certify that ${name}, of legal age, ${citizenship}, and a resident of ${address}, ${barangay}, is known to the undersigned to be of good moral character and has no derogatory record in this Barangay.`);
      line('');
      line(`This certification is issued for whatever legal purpose it may serve.`);
    }
    line('');
    y -= 20;
    line(`Issued this ${today}.`);
    line('');
    line(`${barangay} Barangay Hall`);

    const pdfBytes = await doc.save();
    logActivity(req, { action: 'generate_certificate', resource: 'certificate', resourceId: residentId, details: { type } });
    const filename = `barangay-${type}-${(resident.lastName || 'cert').replace(/\s+/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
