// All MongoDB collections used by the app.
import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });

// A bank that sells health plans (HDFC, SBI, ...).
export const Bank = model('Bank', new Schema({
  slug: { type: String, unique: true },
  name: String,
  shortName: String,
  sector: String, // public | private
  monogram: String, // initials shown in the logo tile
  tint: String, // logo tile colour
  claimSettlementRatio: Number, // % of claims paid
  claimTatDays: Number, // average days to settle a claim
  networkHospitals: Number,
}));

// A health plan sold by a bank.
export const Plan = model('Plan', new Schema({
  slug: { type: String, unique: true },
  bank: ref('Bank'),
  name: String,
  category: String, // essential | comprehensive | premier | senior
  floater: { type: Boolean, default: true }, // can cover a whole family
  maxEntryAge: Number,
  sumInsuredOptions: [Number], // in lakh
  baseRate: Number, // yearly ₹ for one 30-year-old, ₹5L cover, metro city
  roomRent: String, // no-limit | single-private | shared | 1pct
  copayPct: { type: Number, default: 0 },
  copayFromAge: { type: Number, default: 0 },
  pedWaitingYears: Number, // waiting period for existing illness
  pedReductionRider: Boolean,
  declines: [String], // illnesses the plan will not cover
  maternity: { covered: Boolean, waitingYears: Number, limit: Number },
  opd: { covered: Boolean, limit: Number },
  restore: { type: String, default: 'none' }, // unlimited | once | none
  ncb: { perYear: Number, max: Number }, // no-claim bonus %
  consumables: Boolean,
  preHospDays: Number,
  postHospDays: Number,
  healthCheckup: Boolean,
  ayush: { type: Boolean, default: true },
}));

export const User = model('User', new Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true, trim: true },
  mobile: String,
  passwordHash: String, // bcrypt hash, never the real password
}, { timestamps: true }));

// One completed questionnaire: the answers and the ranked plans we showed.
export const Assessment = model('Assessment', new Schema({
  user: ref('User'),
  answers: Object,
  profile: Object,
  results: Array,
  declined: Array,
}, { timestamps: true }));

// A plan the user clicked "I'm interested" on, with the price they saw.
export const Interest = model('Interest', new Schema({
  user: ref('User'),
  plan: ref('Plan'),
  assessment: ref('Assessment'),
  sumInsured: Number,
  monthly: Number,
  annual: Number,
  match: Number,
}, { timestamps: true }).index({ user: 1, plan: 1 }, { unique: true }));

// Plans are sent to the browser with their bank's details merged in.
export function withBank(plan) {
  const b = plan.bank || {};
  return {
    ...plan,
    bank: b.slug,
    bankName: b.name,
    bankShort: b.shortName,
    monogram: b.monogram,
    tint: b.tint,
    claimSettlementRatio: b.claimSettlementRatio,
    claimTatDays: b.claimTatDays,
    networkHospitals: b.networkHospitals,
  };
}
