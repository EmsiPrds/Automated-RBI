import mongoose from 'mongoose';

const DATA_SOURCES = ['self-entered', 'staff-assisted', 'encoded-from-paper'];
const EDUCATIONAL_ATTAINMENT = ['Elementary', 'High School', 'College', 'Post Grad', 'Vocational'];
const SEX = ['Male', 'Female', 'Other'];
const CIVIL_STATUS = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled', 'Common Law', 'Unknown'];

const inhabitantSchema = new mongoose.Schema(
  {
    lastName: { type: String, trim: true },
    firstName: { type: String, trim: true },
    middleName: { type: String, trim: true },
    nameExtension: { type: String, trim: true },
    placeOfBirth: { type: String, trim: true },
    dateOfBirth: { type: Date },
    age: { type: Number },
    sex: { type: String, enum: ['', ...SEX] },
    civilStatus: { type: String, enum: ['', ...CIVIL_STATUS] },
    citizenship: { type: String, trim: true },
    religion: { type: String, trim: true },
    residenceAddress: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    occupation: { type: String, trim: true },
    isLaborEmployed: { type: Boolean, default: false },
    isUnemployed: { type: Boolean, default: false },
    isPWD: { type: Boolean, default: false },
    isOFW: { type: Boolean, default: false },
    isSoloParent: { type: Boolean, default: false },
    isOSY: { type: Boolean, default: false },
    isOSC: { type: Boolean, default: false },
    isIP: { type: Boolean, default: false },
    philSysCardNo: { type: String, trim: true },
    highestEducationalAttainment: { type: String, enum: ['', ...EDUCATIONAL_ATTAINMENT] },
    graduateOrUndergraduate: { type: String, enum: ['', 'Graduate', 'Under Graduate'] },
    courseSpecification: { type: String, trim: true },
    consentObtainedAt: { type: Date },
  },
  { _id: true }
);

export default inhabitantSchema;
export { DATA_SOURCES, EDUCATIONAL_ATTAINMENT, SEX, CIVIL_STATUS };
