import mongoose from 'mongoose';

const bankSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    sector: { type: String, enum: ['public', 'private'], required: true },
    monogram: { type: String, required: true },
    tint: { type: String, required: true }, // UI accent for the monogram tile
    // Service metrics apply to every plan the bank distributes (sample figures).
    claimSettlementRatio: { type: Number, required: true },
    claimTatDays: { type: Number, required: true },
    networkHospitals: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Bank = mongoose.model('Bank', bankSchema);
