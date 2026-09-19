require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Merchant = require('../src/models/Merchant');
const Transaction = require('../src/models/Transaction');
const Product = require('../src/models/Product');
const Customer = require('../src/models/Customer');
const Memory = require('../src/models/Memory');
const memoryService = require('../src/services/memoryService');
const connectDB = require('../src/config/db');

/**
 * GrowKaro Seed Script
 *
 * Creates 3 demo merchants with realistic, pattern-rich transaction data.
 * Patterns are INTENTIONAL so Phase 2 Growth Detector can detect them.
 *
 * Merchant 1 — Cafe Aroma (cafe)
 *   Pattern: Strong Fri/Sat evenings. Weak weekday 2-4 PM.
 *   Products: Cappuccino (strong), Cold Brew (growing), Masala Chai (stable)
 *
 * Merchant 2 — Fresh Kirana (kirana)
 *   Pattern: Strong weekend demand. One product (cooking oil) is declining.
 *   Products: Multiple categories. Repeat customers dominant.
 *
 * Merchant 3 — Style Studio (salon)
 *   Pattern: Weekend appointment surge. Declining weekday bookings.
 *   Higher ticket, lower frequency transactions.
 */

// Seeded pseudo-random (deterministic for reproducible patterns)
let seed = 42;
const seededRandom = () => {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return ((seed >>> 0) / 0xffffffff);
};

const randInt = (min, max) => Math.floor(seededRandom() * (max - min + 1)) + min;
const randFloat = (min, max) => Math.round((seededRandom() * (max - min) + min) * 100) / 100;
const pick = (arr) => arr[Math.floor(seededRandom() * arr.length)];

/**
 * Generate a date N days ago at a specific hour
 */
const dateAt = (daysAgo, hour, minuteOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minuteOffset, 0, 0);
  return d;
};

/**
 * Day weight functions (0=Sun, 1=Mon, ..., 6=Sat)
 * Returns multiplier for transaction probability
 */
const cafeWeekdayWeight = [0.7, 0.6, 0.65, 0.7, 0.75, 1.4, 1.3]; // Fri/Sat strong
const kiranaWeekdayWeight = [1.5, 0.7, 0.7, 0.75, 0.8, 1.0, 1.6]; // Weekend strong
const salonWeekdayWeight = [1.2, 0.5, 0.5, 0.55, 0.6, 0.9, 1.4]; // Weekend surge

/**
 * Hour weight for cafe: peaks at morning (7-10) and evening (6-9 PM)
 * Weak 2-4 PM (this is the intentional pattern Phase 2 will detect)
 */
const cafeHourWeight = (hour) => {
  if (hour >= 7 && hour <= 10) return 1.8;  // morning rush
  if (hour >= 11 && hour <= 13) return 1.2; // lunch
  if (hour >= 14 && hour <= 16) return 0.3; // WEAK AFTERNOON (intentional pattern)
  if (hour >= 17 && hour <= 18) return 0.9; // early evening
  if (hour >= 19 && hour <= 21) return 1.6; // evening peak
  if (hour >= 6 && hour <= 6) return 0.8;   // early
  return 0.1;
};

const kiranaHourWeight = (hour) => {
  if (hour >= 8 && hour <= 11) return 1.5;  // morning
  if (hour >= 17 && hour <= 20) return 1.8; // evening (main shopping)
  if (hour >= 12 && hour <= 16) return 1.0; // afternoon
  if (hour >= 7 && hour <= 7) return 0.6;
  return 0.1;
};

const salonHourWeight = (hour) => {
  if (hour >= 10 && hour <= 12) return 1.6; // morning appointments
  if (hour >= 14 && hour <= 18) return 1.4; // afternoon
  if (hour >= 19 && hour <= 20) return 0.8; // late
  return 0.05;
};

// ─── MERCHANT 1: Cafe Aroma ───────────────────────────────────────────────
const cafeProducts = [
  { name: 'Cappuccino', category: 'beverages', price: 120, trendBias: 1.0 },
  { name: 'Cold Brew Coffee', category: 'beverages', price: 160, trendBias: 1.4 },  // GROWING
  { name: 'Masala Chai', category: 'beverages', price: 60, trendBias: 1.0 },
  { name: 'Espresso', category: 'beverages', price: 90, trendBias: 0.95 },
  { name: 'Croissant', category: 'food', price: 80, trendBias: 1.0 },
  { name: 'Chocolate Cake Slice', category: 'food', price: 120, trendBias: 0.7 },  // DECLINING
  { name: 'Veg Sandwich', category: 'food', price: 100, trendBias: 0.9 },
  { name: 'Muffin', category: 'food', price: 70, trendBias: 1.1 },
];

// ─── MERCHANT 2: Fresh Kirana ─────────────────────────────────────────────
const kiranaProducts = [
  { name: 'Amul Full Cream Milk 500ml', category: 'dairy', price: 28, trendBias: 1.0 },
  { name: 'Refined Cooking Oil 1L', category: 'staples', price: 130, trendBias: 0.55 }, // DECLINING
  { name: 'Basmati Rice 1kg', category: 'staples', price: 95, trendBias: 1.0 },
  { name: 'Lay\'s Chips', category: 'snacks', price: 30, trendBias: 1.3 },   // GROWING
  { name: 'Parle-G Biscuits', category: 'snacks', price: 10, trendBias: 1.1 },
  { name: 'Colgate Toothpaste', category: 'personal-care', price: 55, trendBias: 0.9 },
  { name: 'Detergent Powder 500g', category: 'household', price: 85, trendBias: 1.0 },
  { name: 'Bread Loaf', category: 'bakery', price: 45, trendBias: 1.0 },
  { name: 'Eggs (6 pack)', category: 'dairy', price: 60, trendBias: 1.2 },
  { name: 'Maggi Noodles 4pk', category: 'snacks', price: 56, trendBias: 1.15 },
];

// ─── MERCHANT 3: Style Studio ─────────────────────────────────────────────
const salonProducts = [
  { name: 'Haircut & Styling', category: 'haircare', price: 350, trendBias: 1.0 },
  { name: 'Hair Colour', category: 'haircare', price: 800, trendBias: 0.75 }, // DECLINING
  { name: 'Facial', category: 'skincare', price: 600, trendBias: 1.0 },
  { name: 'Manicure', category: 'nailcare', price: 400, trendBias: 1.2 },
  { name: 'Pedicure', category: 'nailcare', price: 450, trendBias: 1.1 },
  { name: 'Waxing (Arms)', category: 'waxing', price: 250, trendBias: 1.0 },
  { name: 'Head Massage', category: 'massage', price: 300, trendBias: 1.3 }, // GROWING
  { name: 'Bridal Package', category: 'special', price: 3500, trendBias: 1.0 },
];

/**
 * Generate customers for a merchant
 */
const generateCustomers = (merchantId, count, repeatRatio = 0.6) => {
  const names = [
    'Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Deepa Nair', 'Vikram Patel',
    'Sunita Verma', 'Rajesh Gupta', 'Anita Joshi', 'Manoj Yadav', 'Kavita Mehta',
    'Suresh Iyer', 'Pooja Agarwal', 'Nitin Saxena', 'Meena Pillai', 'Arun Reddy',
    'Swati Chaudhary', 'Dinesh Tiwari', 'Ritu Bhatia', 'Sanjay Malhotra', 'Geeta Rao',
    'Harish Nandi', 'Lata Krishnan', 'Pankaj Srivastava', 'Uma Bhatt', 'Ashish Dubey',
    'Neha Kapoor', 'Rohit Jain', 'Smita Deshpande', 'Vivek Menon', 'Asha Choudhury',
  ];

  return Array.from({ length: count }, (_, i) => {
    const name = names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : '');
    const isRepeat = i < count * repeatRatio;
    return {
      _id: new mongoose.Types.ObjectId(),
      merchantId,
      displayName: name,
      totalTransactions: 0,
      totalSpend: 0,
      lastTransactionAt: null,
      firstTransactionAt: null,
      customerSegment: 'new',
      averageOrderValue: 0,
    };
  });
};

/**
 * Generate transactions for a merchant over N days
 */
const generateTransactions = (merchantId, customers, products, days, weekdayWeights, hourWeightFn, baseTxPerDay) => {
  const transactions = [];
  const customerStats = {};
  customers.forEach((c) => { customerStats[c._id.toString()] = { txCount: 0, totalSpend: 0, lastAt: null, firstAt: null }; });

  for (let daysAgo = days; daysAgo >= 0; daysAgo--) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dayOfWeek = date.getDay(); // 0=Sun
    const dayWeight = weekdayWeights[dayOfWeek];

    // Recent weeks have slightly more activity for trend analysis
    const recencyBoost = daysAgo < 15 ? 1.1 : 1.0;

    const txCount = Math.round(baseTxPerDay * dayWeight * recencyBoost * (0.8 + seededRandom() * 0.4));

    for (let t = 0; t < txCount; t++) {
      // Pick hour based on weight
      const hour = pickWeightedHour(hourWeightFn);
      const minute = randInt(0, 59);

      const timestamp = new Date(date);
      timestamp.setHours(hour, minute, randInt(0, 59), 0);

      // Pick 1-3 products
      const itemCount = seededRandom() < 0.7 ? 1 : seededRandom() < 0.7 ? 2 : 3;
      const items = [];
      let totalAmount = 0;

      for (let i = 0; i < itemCount; i++) {
        // Bias product selection by trend (growing products more likely in recent weeks)
        const product = pickProductByTrend(products, daysAgo, days);
        const qty = seededRandom() < 0.8 ? 1 : 2;
        const unitPrice = product.price;
        const totalPrice = unitPrice * qty;
        totalAmount += totalPrice;
        items.push({
          name: product.name,
          category: product.category,
          quantity: qty,
          unitPrice,
          totalPrice,
        });
      }

      // Pick customer (repeat customers get re-picked more)
      const customer = pickCustomer(customers, customerStats);

      const tx = {
        _id: new mongoose.Types.ObjectId(),
        merchantId,
        customerId: customer._id,
        amount: Math.round(totalAmount),
        timestamp,
        paymentStatus: seededRandom() < 0.97 ? 'completed' : 'failed',
        paymentMethod: pick(['upi', 'upi', 'upi', 'card', 'cash']),
        items,
        category: items[0].category,
      };

      if (tx.paymentStatus === 'completed') {
        const custId = customer._id.toString();
        customerStats[custId].txCount += 1;
        customerStats[custId].totalSpend += totalAmount;
        customerStats[custId].lastAt = timestamp;
        if (!customerStats[custId].firstAt) customerStats[custId].firstAt = timestamp;
      }

      transactions.push(tx);
    }
  }

  // Update customer objects with stats
  customers.forEach((c) => {
    const stats = customerStats[c._id.toString()];
    c.totalTransactions = stats.txCount;
    c.totalSpend = Math.round(stats.totalSpend * 100) / 100;
    c.lastTransactionAt = stats.lastAt;
    c.firstTransactionAt = stats.firstAt;
    c.averageOrderValue = stats.txCount > 0 ? Math.round((stats.totalSpend / stats.txCount) * 100) / 100 : 0;
  });

  return transactions;
};

/**
 * Pick hour using weighted distribution
 */
const pickWeightedHour = (weightFn) => {
  const weights = Array.from({ length: 24 }, (_, h) => weightFn(h));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = seededRandom() * total;
  for (let h = 0; h < 24; h++) {
    r -= weights[h];
    if (r <= 0) return h;
  }
  return 12;
};

/**
 * Pick product with trend bias (recent days more likely to pick growing products)
 */
const pickProductByTrend = (products, daysAgo, totalDays) => {
  const recency = 1 - daysAgo / totalDays; // 0=oldest, 1=most recent
  const weights = products.map((p) => {
    const trendEffect = p.trendBias > 1 ? 1 + (p.trendBias - 1) * recency : p.trendBias;
    return Math.max(0.1, trendEffect);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = seededRandom() * total;
  for (let i = 0; i < products.length; i++) {
    r -= weights[i];
    if (r <= 0) return products[i];
  }
  return products[0];
};

/**
 * Pick customer (repeat customers get weighted more frequently)
 */
const pickCustomer = (customers, stats) => {
  // First 40% of list are "regulars" — higher chance to be picked again
  const regularCount = Math.floor(customers.length * 0.4);
  if (seededRandom() < 0.6 && regularCount > 0) {
    return customers[randInt(0, regularCount - 1)];
  }
  return customers[randInt(0, customers.length - 1)];
};

/**
 * Assign customer segments and product stats
 */
const assignSegmentsAndStats = (customers, products, transactions) => {
  const now = new Date();
  const inactiveCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  customers.forEach((c) => {
    const daysSinceLast = c.lastTransactionAt
      ? (now - c.lastTransactionAt) / (1000 * 60 * 60 * 24)
      : Infinity;

    if (daysSinceLast > 30 && c.totalTransactions > 0) c.customerSegment = 'inactive';
    else if (c.totalTransactions >= 2 && c.totalSpend > 5000) c.customerSegment = 'vip';
    else if (c.totalTransactions >= 2) c.customerSegment = 'repeat';
    else c.customerSegment = 'new';
  });

  // Compute product revenue/units from transactions
  const productStats = {};
  transactions.forEach((tx) => {
    if (tx.paymentStatus !== 'completed') return;
    tx.items.forEach((item) => {
      const prod = products.find((p) => p.name === item.name);
      if (!prod) return;
      if (!productStats[prod.name]) productStats[prod.name] = { units: 0, revenue: 0 };
      productStats[prod.name].units += item.quantity;
      productStats[prod.name].revenue += item.totalPrice;
    });
  });

  products.forEach((p) => {
    const stats = productStats[p.name] || { units: 0, revenue: 0 };
    p.unitsSold = stats.units;
    p.revenue = Math.round(stats.revenue);
    // Assign trend based on trendBias baked into seed
    if (p.trendBias >= 1.3) p.trend = 'growing';
    else if (p.trendBias <= 0.7) p.trend = 'declining';
    else p.trend = 'stable';
  });
};

// ─── MAIN SEED FUNCTION ───────────────────────────────────────────────────
const seedDatabase = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    Merchant.deleteMany({}),
    Transaction.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Memory.deleteMany({}),
  ]);

  console.log('Creating merchants...');

  // ── Merchant 1: Cafe Aroma ──
  const cafe = await Merchant.create({
    businessName: 'Cafe Aroma',
    businessType: 'cafe',
    ownerName: 'Rohan Kapoor',
    location: { city: 'Bengaluru', state: 'Karnataka' },
    currency: 'INR',
    preferences: {
      primaryCategory: 'beverages',
      peakHours: [8, 9, 19, 20],
      weakHours: [14, 15, 16],
    },
  });

  // ── Merchant 2: Fresh Kirana ──
  const kirana = await Merchant.create({
    businessName: 'Fresh Kirana',
    businessType: 'kirana',
    ownerName: 'Sunita Agarwal',
    location: { city: 'Mumbai', state: 'Maharashtra' },
    currency: 'INR',
    preferences: {
      primaryCategory: 'staples',
      peakDays: ['Saturday', 'Sunday'],
    },
  });

  // ── Merchant 3: Style Studio ──
  const salon = await Merchant.create({
    businessName: 'Style Studio',
    businessType: 'salon',
    ownerName: 'Priya Nair',
    location: { city: 'Hyderabad', state: 'Telangana' },
    currency: 'INR',
    preferences: {
      primaryCategory: 'haircare',
      appointmentBased: true,
    },
  });

  console.log('Generating seed data for Cafe Aroma...');
  const cafeCustomers = generateCustomers(cafe._id, 40, 0.65);
  const cafeProductDocs = cafeProducts.map((p) => ({ ...p, merchantId: cafe._id, _id: new mongoose.Types.ObjectId() }));
  const cafeTxs = generateTransactions(cafe._id, cafeCustomers, cafeProducts, 90, cafeWeekdayWeight, cafeHourWeight, 22);
  assignSegmentsAndStats(cafeCustomers, cafeProductDocs, cafeTxs);

  console.log('Generating seed data for Fresh Kirana...');
  seed = 137; // reset seed for variety
  const kiranaCustomers = generateCustomers(kirana._id, 55, 0.55);
  const kiranaProductDocs = kiranaProducts.map((p) => ({ ...p, merchantId: kirana._id, _id: new mongoose.Types.ObjectId() }));
  const kiranaTxs = generateTransactions(kirana._id, kiranaCustomers, kiranaProducts, 90, kiranaWeekdayWeight, kiranaHourWeight, 32);
  assignSegmentsAndStats(kiranaCustomers, kiranaProductDocs, kiranaTxs);

  console.log('Generating seed data for Style Studio...');
  seed = 251; // reset seed for variety
  const salonCustomers = generateCustomers(salon._id, 30, 0.7);
  const salonProductDocs = salonProducts.map((p) => ({ ...p, merchantId: salon._id, _id: new mongoose.Types.ObjectId() }));
  const salonTxs = generateTransactions(salon._id, salonCustomers, salonProducts, 90, salonWeekdayWeight, salonHourWeight, 7);
  assignSegmentsAndStats(salonCustomers, salonProductDocs, salonTxs);

  console.log('Inserting customers...');
  await Customer.insertMany([...cafeCustomers, ...kiranaCustomers, ...salonCustomers]);

  console.log('Inserting products...');
  await Product.insertMany([...cafeProductDocs, ...kiranaProductDocs, ...salonProductDocs]);

  console.log('Inserting transactions (this may take a moment)...');
  const allTxs = [...cafeTxs, ...kiranaTxs, ...salonTxs];
  // Insert in batches of 500
  for (let i = 0; i < allTxs.length; i += 500) {
    await Transaction.insertMany(allTxs.slice(i, i + 500));
    process.stdout.write(`\r  Progress: ${Math.min(i + 500, allTxs.length)}/${allTxs.length} transactions`);
  }
  console.log('Seeding Cognee merchant memories...');
  await Promise.all([
    memoryService.seedMerchantMemories(cafe._id, 'cafe'),
    memoryService.seedMerchantMemories(kirana._id, 'kirana'),
    memoryService.seedMerchantMemories(salon._id, 'salon'),
  ]);

  console.log('\n✅ Seed complete!');
  console.log(`   Merchants:    3`);
  console.log(`   Customers:    ${cafeCustomers.length + kiranaCustomers.length + salonCustomers.length}`);
  console.log(`   Products:     ${cafeProductDocs.length + kiranaProductDocs.length + salonProductDocs.length}`);
  console.log(`   Transactions: ${allTxs.length}`);
  console.log('\nDemo merchants:');
  console.log(`  ☕ Cafe Aroma      ID: ${cafe._id}`);
  console.log(`  🛒 Fresh Kirana    ID: ${kirana._id}`);
  console.log(`  💇 Style Studio    ID: ${salon._id}`);

  await mongoose.disconnect();
  process.exit(0);
};

seedDatabase().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});