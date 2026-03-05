import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = ['resident', 'encoder', 'secretary', 'punong_barangay', 'viewer', 'admin'];

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    username: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    password: { type: String, required: true, minlength: 6, select: false },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ROLES },
    barangay: { type: String, trim: true },
    cityMunicipality: { type: String, trim: true },
    province: { type: String, trim: true },
    region: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.index({ barangay: 1, role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
export { ROLES };
