import mongoose from 'mongoose';

const DATA_SOURCES = ['self-entered', 'staff-assisted', 'encoded-from-paper'];
const STATUSES = ['draft', 'submitted', 'certified', 'validated'];
const EDUCATIONAL_ATTAINMENT = ['Elementary', 'High School', 'College', 'Post Grad', 'Vocational'];
const SEX = ['Male', 'Female', 'Other'];
const CIVIL_STATUS = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled', 'Common Law', 'Unknown'];

const formBSchema = new mongoose.Schema(
  {
    region: { type: String, trim: true },
    province: { type: String, trim: true },
    cityMunicipality: { type: String, trim: true },
    barangay: { type: String, trim: true },
    householdNumber: { type: String, trim: true },
    household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household' },
    inhabitantIndex: { type: Number },
    residenceAddress: { type: String, trim: true },
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
    status: { type: String, enum: STATUSES, default: 'draft' },
    dataSource: { type: String, enum: DATA_SOURCES, default: 'self-entered' },
    preparedBy: { type: String, trim: true },
    preparedAt: { type: Date },
    certifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    certifiedAt: { type: Date },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    validatedAt: { type: Date },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    consentObtainedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

formBSchema.index({ barangay: 1 });
formBSchema.index({ status: 1 });
formBSchema.index({ householdNumber: 1 });
formBSchema.index({ cityMunicipality: 1, barangay: 1 });
formBSchema.index({ household: 1, inhabitantIndex: 1 });

export default mongoose.model('FormB', formBSchema);
export { DATA_SOURCES, STATUSES, EDUCATIONAL_ATTAINMENT, SEX, CIVIL_STATUS };
