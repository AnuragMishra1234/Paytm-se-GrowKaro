const mongoose = require('mongoose');
const dns = require('dns');

// Fix: the local DNS stub (127.0.0.1) on some machines doesn't support SRV records
// which are required for mongodb+srv:// connection strings (MongoDB Atlas).
// Explicitly set reliable DNS servers so Node can resolve Atlas hostnames.
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set. Please check your .env file.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
};

module.exports = connectDB;