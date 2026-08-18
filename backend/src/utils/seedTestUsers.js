// Dev-only helper: creates one account per role so all three roles can be
// tested end-to-end. Passwords below are throwaway local-dev credentials,
// not production secrets. Run with `npm run seed` from backend/.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const TEST_USERS = [
  { name: 'Ada Admin', email: 'admin@crm.test', password: 'Admin@123', role: 'admin' },
  { name: 'Mona Manager', email: 'manager@crm.test', password: 'Manager@123', role: 'sales_manager' },
  { name: 'Eddy Executive', email: 'exec1@crm.test', password: 'Exec@123', role: 'sales_executive' },
  { name: 'Eva Executive', email: 'exec2@crm.test', password: 'Exec@123', role: 'sales_executive' },
];

async function seed() {
  await connectDB();

  const manager =
    (await User.findOne({ email: 'manager@crm.test' })) ||
    (await User.create(TEST_USERS[1]));

  for (const spec of TEST_USERS) {
    const exists = await User.findOne({ email: spec.email });
    if (exists) {
      console.log(`Already exists: ${spec.email} (${spec.role})`);
      continue;
    }
    const managerId = spec.role === 'sales_executive' ? manager._id : null;
    await User.create({ ...spec, managerId });
    console.log(`Created: ${spec.email} / ${spec.password} (${spec.role})`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
