const mongoose = require('mongoose');
const env = require('./env');

// Safe to call on every request in a serverless environment: a warm function
// invocation reuses the existing connection instead of opening a new one,
// and callers (server.js for local/traditional mode, api/index.js for
// serverless) decide what to do if it throws.
async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = connectDB;
