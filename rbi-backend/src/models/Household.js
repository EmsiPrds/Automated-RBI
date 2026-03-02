import mongoose from 'mongoose';
import inhabitantSchema from './InhabitantSchema.js';

const DATA_SOURCES = ['self-entered', 'staff-assisted', 'encoded-from-paper'];
const STATUSES = ['draft', 'submitted', 'certified', 'validated'];

const householdSchema = new mongoose.Schema(
  {
    region: { type: String, trim: true },
    province: { type: String, trim: true },
    cityMunicipality: { type: String, trim: true },
    barangay: { type: String, trim: true },
    householdAddress: { type: String, trim: true },
    householdNumber: { type: String, trim: true },
    numberOfMembers: { type: Number, default: 0 },
    status: { type: String, enum: STATUSES, default: 'draft' },
    inhabitants: [inhabitantSchema],
    preparedBy: { type: String, trim: true },
    preparedAt: { type: Date },
    certifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    certifiedAt: { type: Date },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    validatedAt: { type: Date },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dataSource: { type: String, enum: DATA_SOURCES, default: 'self-entered' },
    consentObtainedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

householdSchema.index({ barangay: 1 });
householdSchema.index({ householdNumber: 1 });
householdSchema.index({ status: 1 });
householdSchema.index({ cityMunicipality: 1, barangay: 1 });

export default mongoose.model('Household', householdSchema);
export { DATA_SOURCES, STATUSES };
