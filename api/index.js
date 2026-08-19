// Single Vercel serverless function fronting the whole Express app. Every
// request under /api/* (see vercel.json's rewrite) is forwarded here
// unmodified, and Express's own router (mounted with the same /api prefix
// it already uses locally) takes it from there — no path rewriting needed
// on either side.
const app = require('../backend/src/app');
const connectDB = require('../backend/src/config/db');

module.exports = async (req, res) => {
  await connectDB(); // no-op if a warm invocation already has a live connection
  return app(req, res);
};
