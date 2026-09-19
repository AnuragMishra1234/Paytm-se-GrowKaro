const Groq = require('groq-sdk');

/**
 * aiService.js — Groq AI Reasoning & Natural Language Generation Engine
 *
 * Grounded LLM reasoning layer:
 * - Ingests structured business facts (MongoDB)
 * - Ingests contextual memory (Cognee)
 * - Ingests external ambient signals (Weather/Calendar)
 * - Synthesizes actionable merchant advice
 * - Fallback mode guaranteed: NEVER crashes if API key is missing or network fails
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || null;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

let groqClient = null;
if (GROQ_API_KEY && GROQ_API_KEY.trim() !== '') {
  try {
    groqClient = new Groq({ apiKey: GROQ_API_KEY });
  } catch (err) {
    console.warn(`[Groq Init Warning]: ${err.message}. Falling back to deterministic reasoning.`);
  }
}

/**
 * Safe JSON parser with regex recovery for LLM responses
 */
const safeParseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to extract content between first { and last }
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (err2) {
        // Fallthrough
      }
    }
    return null;
  }
};

/**
 * Execute Groq completion with strict timeout to prevent hung requests
 */
const callGroqWithTimeout = async (params, timeoutMs = 6000) => {
  const completionPromise = groqClient.chat.completions.create(params);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Groq LLM call timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  return await Promise.race([completionPromise, timeoutPromise]);
};

/**
 * Explain an insight and formulate specific recommendation
 */
const explainAndRecommend = async (insight, memoryFacts = [], externalContext = null, merchant = {}) => {
  // Deterministic fallback generator
  const generateFallback = () => {
    let action = insight.defaultAction || 'Review performance and adjust marketing or inventory allocation.';
    let goal = insight.defaultGoal || 'Improve operational velocity and merchant profit margins.';
    let actionTitle = 'Review Business Metric';

    if (insight.type === 'WEAK_HOURS') {
      action = 'Reactivate the ₹199 afternoon combo (beverage + snack pairing) from 2:00 PM to 4:30 PM on weekdays.';
      goal = 'Stimulate afternoon transaction volume without eroding standard evening margins.';
      actionTitle = 'Afternoon Combo Campaign';
    } else if (insight.type === 'PRODUCT_DECLINE') {
      action = `Introduce a bundle featuring ${insight.title.split(': ')[1] || 'this item'} alongside high-velocity staples.`;
      goal = 'Stabilize unit sales volume and clear aged inventory.';
      actionTitle = 'Product Bundle Special';
    } else if (insight.type === 'EXTERNAL_CONTEXT') {
      action = insight.defaultAction || 'Adjust inventory and launch evening takeaway / digital payment perks.';
      goal = 'Capitalize on ambient weather demand.';
      actionTitle = 'Weather Opportunity Campaign';
    }

    // Incorporate merchant memory into explanation if available
    let explanation = `Analysis of recent transaction volume confirms ${insight.title.toLowerCase()}.`;
    if (memoryFacts.length > 0) {
      explanation += ` Historical records show: "${memoryFacts[0].content}".`;
    }

    return {
      explanation,
      recommendation: {
        situation: insight.title,
        evidence: insight.evidence?.join(' ') || 'Observed directly from transaction data.',
        explanation,
        action,
        goal,
        suggestedAction: {
          type: 'CAMPAIGN_DRAFT',
          title: actionTitle,
          details: action,
          targetAudience: 'Repeat & nearby customers',
          timing: 'Next 3 operating days',
          expectedImpact: '+15% to +25% segment transaction lift',
          isExecutable: false, // Phase 3 activates execution
        },
      },
      isGenerative: false,
    };
  };

  if (!groqClient) {
    return generateFallback();
  }

  try {
    const memorySnippet = memoryFacts.map((m) => `- [${m.type}] ${m.content}`).join('\n') || 'None recorded.';
    const contextSnippet = externalContext
      ? `Weather: ${externalContext.weather?.condition} (${externalContext.weather?.temperature}°C). Calendar: ${externalContext.calendar?.dayName}.`
      : 'Normal operating conditions.';

    const systemPrompt = `You are GrowKaro AI, a senior fintech business advisor for digital-payment retail merchants in India.
Your mission is to take an anomaly/opportunity detected from real data, explain WHY it matters in clear business terms, and give a HIGHLY SPECIFIC, actionable next step.
Ground all reasoning strictly in the provided facts and merchant memory. Never invent transaction numbers.

RULES:
1. Ground all reasoning strictly in the provided facts and merchant memory.
2. If RELEVANT MERCHANT BUSINESS MEMORY contains past outcomes (e.g. "+27.4% observed increase" or "+₹45 AOV"), you MUST explicitly reference this proven historical result in your explanation or action (e.g. "Your previous ₹199 afternoon combo showed a +27.4% observed lift. Consider reusing it.").
3. If memory contains merchant preferences or rejected tactics (e.g. prefers combos over blanket % discounts), strictly follow the merchant's preference.
4. Adhere strictly to non-causal attribution wording: use "observed increase/change", never claim unproven direct causality.

Respond ONLY with a valid JSON object matching this exact structure:
{
  "explanation": "2-3 concise sentences explaining what happened and why it matters, citing evidence and past outcomes/memory if relevant.",
  "action": "A single specific, actionable business proposal tailored to this merchant type.",
  "goal": "The exact measurable business goal.",
  "actionTitle": "Short 3-5 word campaign or action title",
  "targetAudience": "Specific customer segment to target",
  "timing": "When to execute (e.g. 2 PM - 5 PM weekdays)",
  "expectedImpact": "Realistic expected outcome (e.g. Target +15% to +25% volume recovery)"
}`;

    const userPrompt = `MERCHANT:
Business: ${merchant.businessName} (${merchant.businessType})
Location: ${merchant.location?.city || 'India'}

DETECTED BUSINESS EVENT:
Type: ${insight.type}
Severity: ${insight.severity}
Title: ${insight.title}
Key Metric: ${insight.metric} = ${insight.currentValue} (Baseline: ${insight.baselineValue || 'N/A'}, Change: ${insight.changePercentage != null ? insight.changePercentage + '%' : 'N/A'})
Evidence:
${insight.evidence?.map((e) => `- ${e}`).join('\n')}

RELEVANT MERCHANT BUSINESS MEMORY (Cognee):
${memorySnippet}

EXTERNAL AMBIENT CONTEXT:
${contextSnippet}

Generate the grounded explanation and recommendation JSON now.`;

    const completion = await callGroqWithTimeout({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 450,
      response_format: { type: 'json_object' },
    }, 6000);

    const parsed = safeParseJSON(completion.choices[0]?.message?.content);
    if (!parsed || !parsed.action) {
      return generateFallback();
    }

    return {
      explanation: parsed.explanation,
      recommendation: {
        situation: insight.title,
        evidence: insight.evidence?.join(' ') || 'Calculated from MongoDB transactions.',
        explanation: parsed.explanation,
        action: parsed.action,
        goal: parsed.goal,
        suggestedAction: {
          type: 'CAMPAIGN_DRAFT',
          title: parsed.actionTitle || 'Recommended Action',
          details: parsed.action,
          targetAudience: parsed.targetAudience || 'Target customers',
          timing: parsed.timing || 'Immediate window',
          expectedImpact: parsed.expectedImpact || 'Volume and revenue recovery',
          isExecutable: false,
        },
      },
      isGenerative: true,
    };
  } catch (err) {
    console.warn(`[Groq Reasoning Fallback]: ${err.message}`);
    return generateFallback();
  }
};

/**
 * AI Copilot Conversational Chat
 */
const chatCopilot = async (merchant, message, conversationHistory = [], analyticsFacts = {}, memoryFacts = [], externalContext = null) => {
  // Deterministic fallback response if Groq is unavailable
  const generateFallbackChat = () => {
    const q = message.toLowerCase();
    let answer = `Here is what your business data shows for **${merchant.businessName}**:`;
    const facts = [];
    let recAction = 'Continue monitoring your sales breakdown across time windows.';
    let recGoal = 'Identify growth bottlenecks and opportunities.';

    if (q.includes('why') && (q.includes('down') || q.includes('fall') || q.includes('drop') || q.includes('low'))) {
      const revChange = analyticsFacts.kpis?.changes?.revenue;
      if (revChange && revChange < 0) {
        answer = `Your daily revenue is down **${Math.abs(revChange).toFixed(1)}%** compared to yesterday. Looking at your hourly pattern, the primary softness occurs during weekday afternoons (2 PM – 4:30 PM) and late evening hours.`;
        facts.push(`Today's revenue: ₹${analyticsFacts.kpis.today?.revenue?.toLocaleString('en-IN') || 0}`);
        facts.push(`Change vs yesterday: ${revChange.toFixed(1)}%`);
        facts.push(`Weekday 2–4 PM traffic is ~70% lower than lunch peak.`);
        recAction = 'Run a targeted afternoon combo offer (e.g. ₹99–₹199 pairing) from 2 PM to 5 PM.';
        recGoal = 'Stimulate slow afternoon footfall and stabilize daily turnover.';
      } else {
        answer = `Your overall revenue is currently stable, but specific time windows like 2 PM – 4:30 PM experience lower transaction density compared to your peak hours.`;
        facts.push(`Average order value: ₹${analyticsFacts.kpis?.today?.aov || 0}`);
        recAction = 'Promote bundled beverage & snack items during slow windows.';
        recGoal = 'Maximize ticket value during lower-density hours.';
      }
    } else if (q.includes('promote') || q.includes('increase') || q.includes('offer') || q.includes('grow')) {
      answer = `Based on your highest-performing categories and customer patterns, the best growth lever right now is an **afternoon value bundle** or a **weekend repeat-customer reward**.`;
      facts.push(`Repeat customer rate: ${analyticsFacts.kpis?.repeatCustomerPct || 40}%`);
      if (memoryFacts.length > 0) facts.push(`Historical insight: ${memoryFacts[0].content}`);
      recAction = 'Reactivate a proven ₹199 combo pairing your top beverage with a popular snack.';
      recGoal = 'Drive incremental sales without offering margin-diluting blanket discounts.';
    } else if (q.includes('product') || q.includes('best') || q.includes('item') || q.includes('selling')) {
      const topProd = analyticsFacts.products?.[0];
      answer = topProd
        ? `Your best-selling item by revenue is **${topProd.name}**, having generated ₹${topProd.revenue.toLocaleString('en-IN')} (${topProd.revenueShare}% of all product revenue).`
        : `Your beverage and food staples represent your core revenue volume.`;
      if (topProd) facts.push(`Top product: ${topProd.name} (₹${topProd.revenue.toLocaleString('en-IN')}, ${topProd.unitsSold} units)`);
      recAction = 'Pair your top seller with slow-moving complementary items as an attractive bundle.';
      recGoal = 'Increase total cart size and clear slower inventory.';
    } else if (q.includes('work') || q.includes('past') || q.includes('campaign') || q.includes('result') || q.includes('outcome') || q.includes('learn') || q.includes('help')) {
      const outcomeMem = memoryFacts.find((m) => m.type === 'past_outcome');
      if (outcomeMem) {
        answer = `Based on your measured campaign results: **${outcomeMem.content}**\n\nYour business records confirm that customer response was highest when pairing popular menu staples during targeted time windows.`;
        facts.push(`Proven outcome: ${outcomeMem.content}`);
        recAction = 'Reactivate this proven campaign structure for your upcoming operating cycle.';
        recGoal = 'Replicate verified historical volume lift.';
      } else {
        answer = `Looking at your historical data, targeted product combos and localized promotions during quiet hours have shown the strongest customer response.`;
        facts.push(`Active learning: Repeat customers account for ${analyticsFacts.kpis?.repeatCustomerPct || 40}% of total transactions.`);
        recAction = 'Run a targeted campaign during your weekday afternoon window.';
        recGoal = 'Validate incremental volume lift.';
      }
    } else if (q.includes('customer') || q.includes('target') || q.includes('repeat') || q.includes('loyalty')) {
      answer = `You have a strong base of repeat patrons (${analyticsFacts.kpis?.repeatCustomerPct || 40}% repeat rate). However, inactive customers who haven't visited in 30+ days need a gentle nudge to return.`;
      facts.push(`Repeat rate: ${analyticsFacts.kpis?.repeatCustomerPct || 40}%`);
      recAction = 'Send a personalized "We miss you" perk or loyalty bonus to customers inactive for 30+ days.';
      recGoal = 'Win back dormant customers before they lapse permanently.';
    } else {
      answer = `Here is your current snapshot for **${merchant.businessName}**: Today's revenue is ₹${analyticsFacts.kpis?.today?.revenue?.toLocaleString('en-IN') || 0} across ${analyticsFacts.kpis?.today?.transactions || 0} transactions (AOV: ₹${analyticsFacts.kpis?.today?.aov || 0}).`;
      facts.push(`Repeat customer rate: ${analyticsFacts.kpis?.repeatCustomerPct || 0}%`);
      recAction = 'Review your Proactive Insights feed on the dashboard for high-priority opportunities.';
      recGoal = 'Maintain steady daily operational performance.';
    }

    return {
      answer,
      facts,
      reasoning: 'Grounded in real-time MongoDB metrics and merchant historical patterns.',
      recommendation: {
        action: recAction,
        goal: recGoal,
      },
      confidence: 'HIGH',
      isGenerative: false,
    };
  };

  if (!groqClient) {
    return generateFallbackChat();
  }

  try {
    const kpis = analyticsFacts.kpis || {};
    const topProducts = analyticsFacts.products?.slice(0, 4) || [];
    const memorySnippet = memoryFacts.map((m) => `- ${m.content}`).join('\n') || 'None recorded.';
    const contextSnippet = externalContext
      ? `${externalContext.weather?.condition} in ${externalContext.weather?.city} (${externalContext.weather?.temperature}°C). Day: ${externalContext.calendar?.dayName}.`
      : 'Normal weather.';

    const systemPrompt = `You are GrowKaro AI, an expert business copilot for small-medium business merchants in India.
You are in direct conversation with the owner of "${merchant.businessName}" (${merchant.businessType} in ${merchant.location?.city || 'India'}).

RULES:
1. Base all quantitative claims STRICTLY on the PROVIDED FACTS. Never invent transaction numbers or revenue.
2. Structure your advice around: What happened, Why, and What specific action the merchant should take.
3. Be concise, respectful, and direct. Use Indian Rupee (₹) amounts.
4. Distinguish verified facts from recommendations.

Respond ONLY with a valid JSON object matching this schema:
{
  "answer": "Clear, friendly markdown response directly answering the merchant's query, citing specific numbers from facts.",
  "facts": ["Fact 1 with numbers", "Fact 2 with numbers"],
  "reasoning": "Brief 1-sentence analytical reason behind the answer.",
  "recommendation": {
    "action": "Specific next action to execute",
    "goal": "Measurable business objective"
  },
  "confidence": "HIGH"
}`;

    const contextPayload = `CURRENT BUSINESS FACTS:
- Today's Revenue: ₹${kpis.today?.revenue || 0} (${kpis.changes?.revenue >= 0 ? '+' : ''}${kpis.changes?.revenue || 0}% vs yesterday)
- Today's Transactions: ${kpis.today?.transactions || 0}
- Average Order Value: ₹${kpis.today?.aov || 0}
- Repeat Customer Rate: ${kpis.repeatCustomerPct || 0}%
- Top Products: ${topProducts.map((p) => `${p.name} (₹${p.revenue})`).join(', ') || 'N/A'}

MERCHANT MEMORY (Cognee):
${memorySnippet}

EXTERNAL AMBIENT CONTEXT:
${contextSnippet}

CONVERSATION HISTORY:
${conversationHistory.slice(-4).map((h) => `${h.role === 'user' ? 'Merchant' : 'GrowKaro'}: ${h.content}`).join('\n')}

MERCHANT QUESTION: "${message}"`;

    const completion = await callGroqWithTimeout({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextPayload },
      ],
      temperature: 0.25,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    }, 7000);

    const parsed = safeParseJSON(completion.choices[0]?.message?.content);
    if (!parsed || !parsed.answer) {
      return generateFallbackChat();
    }

    return {
      ...parsed,
      isGenerative: true,
    };
  } catch (err) {
    console.warn(`[Groq Copilot Fallback]: ${err.message}`);
    return generateFallbackChat();
  }
};

/**
 * Generate a Daily Business Brief
 */
const generateDailyBrief = async (merchant, kpis = {}, topInsights = [], externalContext = null, memoryFacts = []) => {
  const yesterday = kpis.yesterday || {};
  const today = kpis.today || {};
  const changes = kpis.changes || {};

  const weather = externalContext?.weather;
  const calendar = externalContext?.calendar;

  const summary = {
    greeting: `Good morning, ${merchant.ownerName || merchant.businessName}`,
    date: calendar?.formattedDate || new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }),
    yesterdayPerformance: {
      revenue: yesterday.revenue || 0,
      transactions: yesterday.transactions || 0,
      aov: yesterday.aov || 0,
      revenueChange: changes.revenue || 0,
    },
    whatMatters: topInsights.length > 0 ? topInsights[0].title : 'Business operating at baseline pace.',
    topOpportunity: topInsights.find((i) => i.category === 'OPPORTUNITY')?.title || 'Optimize midday operating capacity.',
    externalContextNote: weather ? `${weather.condition} (${weather.temperature}°C) in ${weather.city}.` : 'Normal weather.',
    recommendedAction: topInsights.length > 0 && topInsights[0].recommendation?.action
      ? topInsights[0].recommendation.action
      : 'Review hourly footfall patterns and maintain consistent product availability.',
  };

  return summary;
};

module.exports = {
  explainAndRecommend,
  chatCopilot,
  generateDailyBrief,
};