const mongoose = require('mongoose');
const dns = require('dns');

// Fix: the local DNS stub (127.0.0.1) on some machines doesn't support SRV records
// which are required for mongodb+srv:// connection strings (MongoDB Atlas).
// Explicitly set reliable DNS servers so Node can resolve Atlas hostnames.
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // 1. If explicit Atlas or remote URI provided, attempt connection first
  if (uri && !uri.includes('localhost') && !uri.includes('127.0.0.1')) {
    try {
      console.log('Connecting to remote MongoDB...');
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`⚠️ Could not connect to remote MongoDB: ${err.message}`);
      console.log('Falling back to embedded in-memory MongoDB...');
    }
  } else if (uri && (uri.includes('localhost') || uri.includes('127.0.0.1'))) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`✅ MongoDB connected to local server: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.log('Local MongoDB not running. Starting embedded in-memory database...');
    }
  }

  // 2. Start embedded in-memory MongoDB
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memoryUri = mongodInstance.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`✅ Connected to embedded in-memory MongoDB database`);
    return conn;
  } catch (err) {
    console.error('Failed to initialize embedded MongoDB:', err.message);
    throw err;
  }
};

module.exports = connectDB;