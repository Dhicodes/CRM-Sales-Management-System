const mongoose = require('mongoose');

// Full pipeline behavior (stage-transition rules, Won/Lost handling) lands
// in Phase 5. For now this model exists so lead conversion can create the
// initial deal, and it can be viewed read-only from a Customer's detail page.
const STAGES = ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const STAGE_DEFAULT_PROBABILITY = {
  Qualification: 10,
  Discovery: 25,
  Proposal: 50,
  Negotiation: 75,
  Won: 100,
  Lost: 0,
};

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    originLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    value: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'USD' },
    stage: { type: String, enum: STAGES, default: 'Qualification' },
    probability: { type: Number, min: 0, max: 100, default: 10 },
    expectedRevenue: { type: Number, default: 0 },
    expectedCloseDate: { type: Date, required: true },
    actualCloseDate: { type: Date, default: null },
    lossReason: { type: String, trim: true, default: null },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

dealSchema.pre('save', function computeExpectedRevenue(next) {
  this.expectedRevenue = Math.round(((this.value * this.probability) / 100) * 100) / 100;
  next();
});

dealSchema.index({ assignedTo: 1, stage: 1 });
dealSchema.index({ customer: 1 });
dealSchema.index({ expectedCloseDate: 1 });

module.exports = mongoose.model('Deal', dealSchema);
module.exports.STAGES = STAGES;
module.exports.STAGE_DEFAULT_PROBABILITY = STAGE_DEFAULT_PROBABILITY;
