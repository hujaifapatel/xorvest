import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return { id: this._id, name: this.name, email: this.email, mobile: this.mobile };
};

export const User = mongoose.model('User', userSchema);
