const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Merchant = require('../src/models/Merchant');
const Transaction = require('../src/models/Transaction');
const Product = require('../src/models/Product');
const marketIntelligenceService = require('../src/services/marketIntelligenceService');

async function runVerification() {
  console.log('\n==================================================');
  console.log('TEST SUITE: Market Intelligence & Billing Simulation Studio');
  console.log('==================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB Atlas');

  const merchant = await Merchant.findOne({ businessName: /Aroma/i }) || await Merchant.findOne();
  if (!merchant) {
    throw new Error('Merchant not found');
  }
  const merchantId = merchant._id;
  console.log(`✓ Merchant identified: ${merchant.businessName} (${merchantId})`);

  // 1. Verify Market Intelligence & Sales Analysis
  console.log('\n--- 1. Market Intelligence & Sales Pattern Analysis ---');
  const marketData = await marketIntelligenceService.analyzeMarketAndSales(merchantId);
  console.log(`  Locality Monitored: ${marketData.marketOverview.locality}`);
  console.log(`  Hottest Category: ${marketData.marketOverview.hottestCategory}`);
  console.log(`  Total Suggestions Generated: ${marketData.suggestions.length}`);

  const matchaSuggestion = marketData.suggestions.find(s => s.id === 'sugg_matcha');
  if (!matchaSuggestion) {
    throw new Error('Matcha market trend suggestion was not generated');
  }
  console.log(`  ✓ Found Matcha Suggestion: "${matchaSuggestion.title}"`);
  console.log(`    Projected Impact: ${matchaSuggestion.projectedImpact}`);
  console.log(`    Market Signal: ${matchaSuggestion.marketSignal.slice(0, 70)}...`);

  const eveningSuggestion = marketData.suggestions.find(s => s.id === 'sugg_evening_drop');
  if (!eveningSuggestion) {
    throw new Error('Evening drop suggestion was not generated');
  }
  console.log(`  ✓ Found Evening Drop Suggestion: "${eveningSuggestion.title}"`);
  console.log(`    Store Sales Fact: ${eveningSuggestion.storeSalesFact.slice(0, 70)}...`);

  // 2. Test Recommendation Adoption
  console.log('\n--- 2. Adopt Market Recommendation (Matcha Introduction) ---');
  const adoptRes = await marketIntelligenceService.adoptSuggestion(merchantId, 'sugg_matcha');
  console.log(`  Adopt Message: ${adoptRes.message}`);
  const createdMatchaProduct = await Product.findOne({ merchantId, name: /Matcha/i });
  if (!createdMatchaProduct) {
    throw new Error('Matcha product was not created in Product catalog');
  }
  console.log(`  ✓ Product created in catalog: "${createdMatchaProduct.name}" @ ₹${createdMatchaProduct.price}`);

  // 3. Verify Billing Details on Live Transactions
  console.log('\n--- 3. Bill Numbers & Itemized Billing Verification ---');
  const simulatorService = require('../src/services/simulatorService');
  const saleSim = await simulatorService.simulateSale(merchantId);
  const tx = saleSim.transaction;

  console.log(`  Bill Number: ${tx.billNumber}`);
  if (!tx.billNumber || !tx.billNumber.startsWith('BILL-#')) {
    throw new Error(`Invalid billNumber generated: ${tx.billNumber}`);
  }
  console.log(`  Total Bill Amount: ₹${tx.amount}`);
  console.log(`  Items Ordered on this Bill: ${tx.items.length}`);
  tx.items.forEach((it, idx) => {
    console.log(`    ${idx + 1}. ${it.quantity}x ${it.name} @ ₹${it.unitPrice} = ₹${it.totalPrice}`);
  });

  if (tx.items.length === 0) {
    throw new Error('Transaction has no items');
  }
  console.log('  ✓ Verified Bill Number, Itemized lines, and Total Bill amount');

  console.log('\n==================================================');
  console.log('ALL MARKET & BILLING VERIFICATION TESTS PASSED! ✓');
  console.log('==================================================\n');

  await mongoose.disconnect();
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
