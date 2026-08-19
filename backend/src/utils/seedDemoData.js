// Populates the CRM with realistic fake data on top of the four standard
// test accounts, so a freshly deployed environment isn't empty. Goes through
// the real services (not raw Model.create()) wherever practical, so the
// same side effects a real user's actions would trigger — Timeline entries,
// Notifications, expectedRevenue recalculation — happen here too. Safe to
// re-run: it checks for one known marker lead and exits early if found.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');

const leadService = require('../services/leadService');
const customerService = require('../services/customerService');
const dealService = require('../services/dealService');
const leadConversionService = require('../services/leadConversionService');
const activityService = require('../services/activityService');

const TEST_USERS = [
  { name: 'Ada Admin', email: 'admin@crm.test', password: 'Admin@123', role: 'admin' },
  { name: 'Mona Manager', email: 'manager@crm.test', password: 'Manager@123', role: 'sales_manager' },
  { name: 'Eddy Executive', email: 'exec1@crm.test', password: 'Exec@123', role: 'sales_executive' },
  { name: 'Eva Executive', email: 'exec2@crm.test', password: 'Exec@123', role: 'sales_executive' },
];

const MARKER_EMAIL = 'sunita.rao@brightgear.example';

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function ensureUsers() {
  const manager =
    (await User.findOne({ email: 'manager@crm.test' })) || (await User.create(TEST_USERS[1]));

  const byEmail = {};
  for (const spec of TEST_USERS) {
    let user = await User.findOne({ email: spec.email });
    if (!user) {
      const managerId = spec.role === 'sales_executive' ? manager._id : null;
      user = await User.create({ ...spec, managerId });
      console.log(`Created user: ${spec.email} / ${spec.password} (${spec.role})`);
    }
    byEmail[spec.email] = user;
  }
  return byEmail;
}

const LEADS = [
  { name: 'Rahul Mehta', company: 'Northwind Traders', source: 'website', priority: 'high', status: 'new' },
  { name: 'Priya Nair', company: 'Bluepeak Systems', source: 'referral', priority: 'medium', status: 'new' },
  { name: 'Arjun Kapoor', company: 'Vertex Logistics', source: 'social_media', priority: 'low', status: 'new' },
  { name: 'Sunita Rao', company: 'Brightgear Manufacturing', email: MARKER_EMAIL, source: 'email', priority: 'high', status: 'contacted' },
  { name: 'Karan Malhotra', company: 'Skyline Retail', source: 'phone', priority: 'medium', status: 'contacted' },
  { name: 'Neha Joshi', company: 'Ironclad Security', source: 'website', priority: 'medium', status: 'contacted' },
  { name: 'Vikram Singh', company: 'Coral Bay Hospitality', source: 'referral', priority: 'high', status: 'qualified' },
  { name: 'Ananya Iyer', company: 'Falcon Freight', source: 'website', priority: 'high', status: 'qualified' },
  { name: 'Rohan Desai', company: 'Pinewood Realty', source: 'social_media', priority: 'low', status: 'unqualified' },
  { name: 'Meera Pillai', company: 'Solstice Media', source: 'email', priority: 'medium', status: 'new' },
  { name: 'Aditya Rao', company: 'Granite Finance', source: 'phone', priority: 'low', status: 'new' },
  { name: 'Ishaan Bhatt', company: 'Cedar & Co.', source: 'website', priority: 'medium', status: 'new' },
];

async function seedLeadsAndConversions(admin, exec1, exec2) {
  const created = [];
  for (let i = 0; i < LEADS.length; i += 1) {
    const spec = LEADS[i];
    const assignee = i % 5 === 0 ? null : i % 2 === 0 ? exec1 : exec2; // every 5th left unassigned
    const lead = await leadService.createLead(
      {
        name: spec.name,
        email: spec.email,
        company: spec.company,
        source: spec.source,
        priority: spec.priority,
        assignedTo: assignee ? assignee._id : null,
      },
      admin,
      null
    );
    if (spec.status !== 'new') {
      await leadService.updateLead(lead._id, { status: spec.status }, admin, null);
    }
    created.push({ id: lead._id, name: spec.name, status: spec.status, assignee });
  }

  // Convert the two qualified leads into Customer + Deal, exercising the real flow.
  const qualified = created.filter((l) => l.status === 'qualified');
  const conversions = [];
  for (const lead of qualified) {
    const result = await leadConversionService.convertLead(
      lead.id,
      {
        dealTitle: `${lead.name.split(' ')[0]} — Initial Engagement`,
        dealValue: 15000 + Math.round(Math.random() * 40000),
        expectedCloseDate: daysFromNow(30 + Math.round(Math.random() * 30)),
      },
      admin,
      null
    );
    conversions.push(result);
    console.log(`Converted lead "${lead.name}" -> customer + deal`);
  }

  return conversions;
}

async function seedStandaloneCustomersAndDeals(admin, exec1, exec2) {
  const specs = [
    { name: 'Orion Retail Group', company: 'Orion Retail Group', assignee: exec1 },
    { name: 'Cascade Analytics', company: 'Cascade Analytics', assignee: exec2 },
    { name: 'Harborline Shipping', company: 'Harborline Shipping', assignee: exec1 },
  ];

  const results = [];
  for (const spec of specs) {
    const customer = await customerService.createCustomer(
      { name: spec.name, company: spec.company, assignedTo: spec.assignee._id },
      admin,
      null
    );
    results.push({ customer, assignee: spec.assignee });
  }

  const stageSpecs = [
    { stage: 'Discovery', value: 22000 },
    { stage: 'Proposal', value: 48000 },
    { stage: 'Negotiation', value: 76000 },
    { stage: 'Won', value: 31000 },
    { stage: 'Lost', value: 19000 },
  ];

  let i = 0;
  for (const { customer, assignee } of results) {
    // Give each standalone customer 1-2 deals moving through the pipeline.
    const dealsForCustomer = i === 0 ? 2 : 1;
    for (let d = 0; d < dealsForCustomer; d += 1) {
      const spec = stageSpecs[i % stageSpecs.length];
      i += 1;
      const deal = await dealService.createDeal(
        {
          title: `${customer.name} — ${spec.stage === 'Won' || spec.stage === 'Lost' ? 'Renewal' : 'New Business'} Deal`,
          value: spec.value,
          currency: 'USD',
          customerId: customer._id,
          expectedCloseDate: daysFromNow(20 + Math.round(Math.random() * 60)),
          assignedTo: assignee._id,
        },
        admin,
        null
      );
      if (spec.stage === 'Won') {
        await dealService.changeStage(deal._id, { stage: 'Discovery' }, admin, null);
        await dealService.changeStage(deal._id, { stage: 'Proposal' }, admin, null);
        await dealService.changeStage(deal._id, { stage: 'Won' }, admin, null);
      } else if (spec.stage === 'Lost') {
        await dealService.changeStage(
          deal._id,
          { stage: 'Lost', lossReason: 'Prospect chose a competing vendor on price.' },
          admin,
          null
        );
      } else if (spec.stage !== 'Qualification') {
        await dealService.changeStage(deal._id, { stage: spec.stage }, admin, null);
      }
    }
  }

  return results;
}

async function seedActivities(admin, entities) {
  const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'demo', 'reminder'];
  const dueOffsets = [-5, -2, -1, 1, 2, 3, 5, 7, 10, 14]; // negative = overdue

  for (let i = 0; i < entities.length; i += 1) {
    const entity = entities[i];
    const offset = dueOffsets[i % dueOffsets.length];
    const type = ACTIVITY_TYPES[i % ACTIVITY_TYPES.length];
    const activity = await activityService.createActivity(
      {
        type,
        relatedToType: entity.type,
        relatedToId: entity.id,
        dueDate: daysFromNow(offset),
        assignedTo: entity.assignee._id,
        notes: `${type[0].toUpperCase()}${type.slice(1)} follow-up for ${entity.label}`,
      },
      admin,
      null
    );
    // Mark the older, already-past-due ones as a mix of completed/still-pending
    // (a mix makes "completed", "pending", and "overdue" all present in the demo).
    if (offset < 0 && i % 2 === 0) {
      await activityService.updateActivity(activity._id, { status: 'completed' }, admin, null);
    }
  }
}

async function seed() {
  await connectDB();

  const existingMarker = await Lead.findOne({ email: MARKER_EMAIL });
  if (existingMarker) {
    console.log('Demo data already present (marker lead found) — skipping. Nothing changed.');
    await mongoose.disconnect();
    return;
  }

  const users = await ensureUsers();
  const admin = users['admin@crm.test'];
  const exec1 = users['exec1@crm.test'];
  const exec2 = users['exec2@crm.test'];

  console.log('Seeding leads (and converting the qualified ones)...');
  const conversions = await seedLeadsAndConversions(admin, exec1, exec2);

  console.log('Seeding standalone customers + pipeline deals...');
  const standalone = await seedStandaloneCustomersAndDeals(admin, exec1, exec2);

  console.log('Seeding follow-up activities...');
  const activityTargets = [];
  for (const { lead, customer, deal } of conversions) {
    activityTargets.push({ type: 'Lead', id: lead._id, assignee: lead.assignedTo, label: lead.name });
    activityTargets.push({ type: 'Customer', id: customer._id, assignee: customer.assignedTo, label: customer.name });
    activityTargets.push({ type: 'Deal', id: deal._id, assignee: deal.assignedTo, label: deal.title });
  }
  for (const { customer, assignee } of standalone) {
    activityTargets.push({ type: 'Customer', id: customer._id, assignee, label: customer.name });
  }
  const openLeads = await Lead.find({ status: { $in: ['new', 'contacted'] } }).limit(6);
  for (const lead of openLeads) {
    if (!lead.assignedTo) continue;
    activityTargets.push({ type: 'Lead', id: lead._id, assignee: { _id: lead.assignedTo }, label: lead.name });
  }
  await seedActivities(admin, activityTargets);

  const [leadCount, customerCount, dealCount] = await Promise.all([
    Lead.countDocuments(),
    Customer.countDocuments(),
    Deal.countDocuments(),
  ]);
  console.log(`Done. Leads: ${leadCount}, Customers: ${customerCount}, Deals: ${dealCount}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Demo seed failed:', err);
  process.exit(1);
});
