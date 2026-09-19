require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connectDB = require('../src/config/db');
const telemetrySyncService = require('../src/services/telemetrySyncService');
const mongoose = require('mongoose');

async function run() {
  await connectDB();
  console.log('Running telemetry sync for all merchants...');
  await telemetrySyncService.syncAllMerchants();
  console.log('Telemetry sync finished!');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error running telemetry sync:', err);
  process.exit(1);
});
