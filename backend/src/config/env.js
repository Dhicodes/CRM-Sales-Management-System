require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crm_sales_db',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

module.exports = env;
