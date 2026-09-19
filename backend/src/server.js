require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const Merchant = require('./models/Merchant');

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // Auto-seed demo data if database is empty
  try {
    const merchantCount = await Merchant.countDocuments();
    if (merchantCount === 0) {
      console.log('📦 Empty database detected. Auto-seeding demo merchants and transactions...');
      const seedDatabase = require('../scripts/seed');
      await seedDatabase(false);
      console.log('✅ Demo data auto-seeded successfully!');
    }
  } catch (seedErr) {
    console.warn('⚠️ Auto-seed check warning:', seedErr.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 GrowKaro backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err.message);
  process.exit(1);
});
