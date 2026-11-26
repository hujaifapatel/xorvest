import mongoose from 'mongoose';

const { Schema } = mongoose;

const planSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    insurer: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['essential', 'comprehensive', 'premier', 'senior'], required: true },
    floater: { type: Boolean, default: true },
    maxEntryAge: { type: Number, required: true },
    sumInsuredOptions: { type: [Number], required: true }, // in lakh
    baseRate: { type: Number, required: true }, // annual INR, 30y individual, 5L, metro, ex-GST
    roomRent: { type: String, enum: ['no-limit', 'single-private', 'shared', '1pct'], required: true },
    copayPct: { type: Number, default: 0 },
    copayFromAge: { type: Number, default: 0 }, // co-pay applies when eldest member is at or above this age (0 = always)
    pedWaitingYears: { type: Number, required: true },
    pedReductionRider: { type: Boolean, default: false },
    declines: { type: [String], default: [] }, // conditions the insurer will not underwrite
    maternity: {
      covered: { type: Boolean, default: false },
      waitingYears: Number,
      limit: Number, // INR
    },
    opd: {
      covered: { type: Boolean, default: false },
      limit: Number,
    },
    restore: { type: String, enum: ['unlimited', 'once', 'none'], default: 'none' },
    ncb: {
      perYear: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    consumables: { type: Boolean, default: false },
    preHospDays: Number,
    postHospDays: Number,
    healthCheckup: { type: Boolean, default: false },
    ayush: { type: Boolean, default: true },
    networkHospitals: { type: Number, required: true },
    claimSettlementRatio: { type: Number, required: true }, // percent
    claimTatDays: { type: Number, required: true }, // average reimbursement turnaround
    note: String,
  },
  { timestamps: true }
);

export const Plan = mongoose.model('Plan', planSchema);
