import mongoose from 'mongoose';

const { Schema } = mongoose;

const planSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    bank: { type: Schema.Types.ObjectId, ref: 'Bank', required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['essential', 'comprehensive', 'premier', 'senior'], required: true },
    floater: { type: Boolean, default: true },
    maxEntryAge: { type: Number, required: true },
    sumInsuredOptions: { type: [Number], required: true }, // in lakh
    baseRate: { type: Number, required: true }, // annual INR, 30y individual, 5L, metro, ex-GST
    roomRent: { type: String, enum: ['no-limit', 'single-private', 'shared', '1pct'], required: true },
    copayPct: { type: Number, default: 0 },
    copayFromAge: { type: Number, default: 0 },
    pedWaitingYears: { type: Number, required: true },
    pedReductionRider: { type: Boolean, default: false },
    declines: { type: [String], default: [] },
    maternity: { covered: { type: Boolean, default: false }, waitingYears: Number, limit: Number },
    opd: { covered: { type: Boolean, default: false }, limit: Number },
    restore: { type: String, enum: ['unlimited', 'once', 'none'], default: 'none' },
    ncb: { perYear: { type: Number, default: 0 }, max: { type: Number, default: 0 } },
    consumables: { type: Boolean, default: false },
    preHospDays: Number,
    postHospDays: Number,
    healthCheckup: { type: Boolean, default: false },
    ayush: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Plan = mongoose.model('Plan', planSchema);

// Plans are scored and displayed with their bank's service metrics folded in.
export function flattenPlan(plan) {
  const b = plan.bank || {};
  return {
    ...plan,
    bank: b.slug,
    bankName: b.name,
    bankShort: b.shortName,
    monogram: b.monogram,
    tint: b.tint,
    insurer: b.name,
    claimSettlementRatio: b.claimSettlementRatio,
    claimTatDays: b.claimTatDays,
    networkHospitals: b.networkHospitals,
  };
}
