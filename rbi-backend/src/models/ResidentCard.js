import mongoose from 'mongoose';

const residentCardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    idNumber: { type: String, required: true, unique: true, trim: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

residentCardSchema.index({ user: 1 }, { unique: true });
// idNumber index omitted: unique: true on idNumber field already creates an index

export default mongoose.model('ResidentCard', residentCardSchema);
