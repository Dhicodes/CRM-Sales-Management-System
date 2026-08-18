const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { sendSuccess } = require('./utils/apiResponse');

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  sendSuccess(res, 200, { status: 'ok', env: env.nodeEnv }, 'API is healthy');
});

// Resource routes (leads, customers, deals, activities, notifications,
// dashboard, auth) are added in later phases.

app.use(notFound);
app.use(errorHandler);

module.exports = app;
