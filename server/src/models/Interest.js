import mongoose from 'mongoose';

const { Schema } = mongoose;

// A plan the user marked as "interested". Price fields are a snapshot from the
// recommendation the user was looking at, when there was one.
const interestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    assessment: { type: Schema.Types.ObjectId, ref: 'Assessment' },
    sumInsured: Number,
    monthly: Number,
    annual: Number,
    match: Number,
  },
  { timestamps: true }
);

interestSchema.index({ user: 1, plan: 1 }, { unique: true });

export const Interest = mongoose.model('Interest', interestSchema);
