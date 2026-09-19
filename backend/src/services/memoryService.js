const Memory = require('../models/Memory');

/**
 * memoryService.js — Cognee Merchant Business Memory Layer
 *
 * Provides persistent, contextual business memory for AI reasoning.
 * Connects to external Cognee endpoint if configured, and persists
 * memory facts seamlessly in MongoDB.
 */

// Cognee API configuration (if configured in environment)
const COGNEE_API_URL = process.env.COGNEE_API_URL || null;
const COGNEE_API_KEY = process.env.COGNEE_API_KEY || null;

/**
 * Store a new business memory fact
 */
const storeMemory = async (merchantId, { type, key, content, tags = [], metadata = {}, confidence = 1.0, source = 'system_observed' }) => {
  try {
    const memory = await Memory.findOneAndUpdate(
      { merchantId, key },
      {
        merchantId,
        type,
        key,
        content,
        tags,
        metadata,
        confidence,
        source,
      },
      { upsert: true, new: true }
    );

    // If external Cognee service is configured, push asynchronously
    if (COGNEE_API_URL) {
      syncWithCognee(memory).catch((err) => {
        console.warn(`[Cognee Sync Warning]: ${err.message}`);
      });
    }

    return memory;
  } catch (err) {
    console.error(`[Memory Service Error]: Failed to store memory: ${err.message}`);
    throw err;
  }
};

/**
 * Sync memory to external Cognee instance if available
 */
const syncWithCognee = async (memory) => {
  if (!COGNEE_API_URL) return;
  try {
    await fetch(`${COGNEE_API_URL}/api/v1/memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(COGNEE_API_KEY ? { Authorization: `Bearer ${COGNEE_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        id: memory._id.toString(),
        merchantId: memory.merchantId.toString(),
        content: memory.content,
        type: memory.type,
        metadata: memory.metadata,
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (err) {
    // Cognee failure is logged but non-blocking per spec
    console.warn(`[Cognee Remote Sync]: ${err.message}`);
  }
};

/**
 * Retrieve all memories for a merchant
 */
const getMerchantMemories = async (merchantId, filter = {}) => {
  try {
    const query = { merchantId, ...filter };
    return await Memory.find(query).sort({ updatedAt: -1 }).lean();
  } catch (err) {
    console.error(`[Memory Service Error]: ${err.message}`);
    return [];
  }
};

/**
 * Search and retrieve relevant memories for prompt grounding
 */
const getRelevantMemoryContext = async (merchantId, topicQuery = '') => {
  try {
    const allMemories = await Memory.find({ merchantId }).lean();
    if (!allMemories.length) return [];

    if (!topicQuery) {
      return allMemories.slice(0, 8);
    }

    const queryTerms = topicQuery.toLowerCase().split(/\s+/).filter(Boolean);

    // Simple keyword/tag scoring
    const scored = allMemories.map((mem) => {
      const text = `${mem.content} ${mem.key} ${mem.tags?.join(' ') || ''}`.toLowerCase();
      let score = 0;
      queryTerms.forEach((term) => {
        if (text.includes(term)) score += 2;
      });
      // Boost past outcomes and preferences for recommendations
      if (mem.type === 'past_outcome') score += 1.5;
      if (mem.type === 'preference') score += 1.0;
      return { ...mem, score };
    });

    return scored
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  } catch (err) {
    console.warn(`[Memory Retrieval Error]: ${err.message}`);
    return [];
  }
};

/**
 * Seed realistic default memories for demo merchants
 */
const seedMerchantMemories = async (merchantId, businessType) => {
  const existingCount = await Memory.countDocuments({ merchantId });
  if (existingCount > 0) return; // already seeded

  const memories = [];

  if (businessType === 'cafe' || businessType === 'restaurant') {
    memories.push(
      {
        type: 'pattern',
        key: 'weak_afternoon_window',
        content: 'Weekday afternoons (2:00 PM – 4:30 PM) consistently show 65%-75% lower footfall than morning and evening hours.',
        tags: ['hours', 'afternoon', 'traffic', 'weak'],
      },
      {
        type: 'pattern',
        key: 'weekend_evening_strength',
        content: 'Friday and Saturday evenings (7:00 PM – 9:30 PM) deliver 38% of total weekly beverage and food revenue.',
        tags: ['peak', 'weekend', 'evening', 'revenue'],
      },
      {
        type: 'past_recommendation',
        key: 'evening_combo_offer',
        content: 'Previously recommended activating a ₹199 Evening Combo (Cold Brew + Croissant / Snack).',
        tags: ['campaign', 'combo', 'evening', '199'],
      },
      {
        type: 'past_outcome',
        key: 'evening_combo_success',
        content: 'Past ₹199 evening combo campaign was associated with a +22% observed increase in evening transaction count.',
        tags: ['success', 'combo', 'evening', 'lift'],
      },
      {
        type: 'preference',
        key: 'discount_preference',
        content: 'Merchant strongly prefers bundled product combos and value adds over straight 10%-20% percentage discounts.',
        tags: ['preference', 'combo', 'pricing'],
      },
      {
        type: 'pattern',
        key: 'weather_beverage_correlation',
        content: 'Historical transaction records indicate that rainy weather increases hot beverage and chai orders by over 25%.',
        tags: ['weather', 'rain', 'beverages', 'chai'],
      }
    );
  } else if (businessType === 'kirana' || businessType === 'retail') {
    memories.push(
      {
        type: 'pattern',
        key: 'weekend_grocery_surge',
        content: 'Saturdays and Sundays generate more than 52% of entire weekly sales volume and transaction count.',
        tags: ['weekend', 'surge', 'traffic', 'staples'],
      },
      {
        type: 'pattern',
        key: 'cooking_oil_decline',
        content: 'Refined Cooking Oil 1L sales have steadily declined by 35% over the past 60 days due to competitive pricing.',
        tags: ['product', 'declining', 'cooking_oil', 'margin'],
      },
      {
        type: 'past_outcome',
        key: 'countertop_snack_display',
        content: 'Displaying Lay\'s chips and quick snacks at the payment billing desk increased average basket size by ₹45.',
        tags: ['snack', 'counter', 'basket_size', 'impulse'],
      },
      {
        type: 'preference',
        key: 'inventory_velocity',
        content: 'Merchant prefers fast inventory turnover on staples rather than holding slow-moving high-margin specialty items.',
        tags: ['preference', 'inventory', 'velocity'],
      }
    );
  } else if (businessType === 'salon') {
    memories.push(
      {
        type: 'pattern',
        key: 'weekend_appointment_demand',
        content: 'Weekend appointment slots operate at 95%+ booking capacity; weekday mid-day slots have 40% unused chair time.',
        tags: ['appointments', 'weekend', 'capacity'],
      },
      {
        type: 'pattern',
        key: 'head_massage_growth',
        content: 'Head massage bookings grew by 28% month-over-month following client recommendation promotions.',
        tags: ['growing', 'head_massage', 'service'],
      },
      {
        type: 'pattern',
        key: 'hair_colour_decline',
        content: 'Hair colouring package bookings experienced a 25% dip due to price competition from local studios.',
        tags: ['declining', 'hair_colour', 'service'],
      },
      {
        type: 'preference',
        key: 'client_communication',
        content: 'Merchant prefers targeted WhatsApp booking reminders to high-value VIP clients rather than public broadcast deals.',
        tags: ['preference', 'vip', 'retention', 'whatsapp'],
      }
    );
  }

  for (const mem of memories) {
    await storeMemory(merchantId, { ...mem, source: 'seed' });
  }
};

module.exports = {
  storeMemory,
  getMerchantMemories,
  getRelevantMemoryContext,
  seedMerchantMemories,
};