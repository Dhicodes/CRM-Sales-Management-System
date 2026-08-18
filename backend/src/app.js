const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { sendSuccess } = require('./utils/apiResponse');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  sendSuccess(res, 200, { status: 'ok', env: env.nodeEnv }, 'API is healthy');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Resource routes (leads, customers, deals, activities, notifications,
// dashboard) are added in later phases.

app.use(notFound);
app.use(errorHandler);

module.exports = app;
