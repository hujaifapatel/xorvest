import mongoose from 'mongoose';

const { Schema } = mongoose;

const assessmentSchema = new Schema(
  {
    answers: { type: Schema.Types.Mixed, required: true },
    profile: { type: Schema.Types.Mixed, required: true },
    results: { type: Schema.Types.Mixed, required: true },
    declined: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true, minimize: false }
);

export const Assessment = mongoose.model('Assessment', assessmentSchema);
