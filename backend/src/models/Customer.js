const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    address: { type: String, trim: true },
    // Set when created via lead conversion; null for customers added directly.
    originLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    // Unlike Lead, a Customer is always owned there is no unassigned pool.
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

customerSchema.index({ assignedTo: 1 });
customerSchema.index({ name: 'text', email: 'text', company: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
