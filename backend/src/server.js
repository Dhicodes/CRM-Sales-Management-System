const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
