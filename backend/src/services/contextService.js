/**
 * contextService.js — External Context Intelligence
 *
 * Connects to live weather (Open-Meteo API, free & no key needed)
 * and evaluates relevance against merchant business type and location.
 */

// City coordinates mapping for demo locations
const CITY_COORDINATES = {
  bengaluru: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru' },
  bangalore: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru' },
  mumbai: { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
  hyderabad: { lat: 17.3850, lon: 78.4867, name: 'Hyderabad' },
  delhi: { lat: 28.6139, lon: 77.2090, name: 'Delhi' },
};

// Weather code interpreter (WMO standard)
const interpretWeatherCode = (code) => {
  if (code === 0) return { condition: 'Clear Sky', isRain: false, isGloomy: false, icon: '' };
  if (code >= 1 && code <= 3) return { condition: 'Partly Cloudy', isRain: false, isGloomy: false, icon: '' };
  if (code >= 45 && code <= 48) return { condition: 'Foggy', isRain: false, isGloomy: true, icon: '' };
  if (code >= 51 && code <= 55) return { condition: 'Drizzle', isRain: true, isGloomy: true, icon: '' };
  if (code >= 61 && code <= 67) return { condition: 'Rain', isRain: true, isGloomy: true, icon: '' };
  if (code >= 71 && code <= 77) return { condition: 'Snow', isRain: false, isGloomy: true, icon: '' };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', isRain: true, isGloomy: true, icon: '' };
  if (code >= 95) return { condition: 'Thunderstorm', isRain: true, isGloomy: true, icon: '' };
  return { condition: 'Mild', isRain: false, isGloomy: false, icon: '' };
};

// Simple memory cache to prevent excessive external requests (30-min TTL)
const weatherCache = new Map();

/**
 * Fetch live weather from Open-Meteo for a given city
 */
const fetchCityWeather = async (city = 'Bengaluru') => {
  const normCity = city.trim().toLowerCase();
  const coords = CITY_COORDINATES[normCity] || CITY_COORDINATES.bengaluru;

  const now = Date.now();
  const cached = weatherCache.get(coords.name);
  if (cached && now - cached.timestamp < 30 * 60 * 1000) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=Asia/Kolkata`;
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error(`Weather API returned ${response.status}`);
    const data = await response.json();

    const current = data.current || {};
    const weatherInfo = interpretWeatherCode(current.weather_code);

    const result = {
      city: coords.name,
      temperature: Math.round(current.temperature_2m || 26),
      precipitation: current.precipitation || 0,
      condition: weatherInfo.condition,
      isRain: weatherInfo.isRain || current.precipitation > 0,
      isGloomy: weatherInfo.isGloomy,
      icon: weatherInfo.icon,
      humidity: current.relative_humidity_2m || 65,
      fetchedAt: new Date(),
    };

    weatherCache.set(coords.name, { timestamp: now, data: result });
    return result;
  } catch (err) {
    // Graceful fallback for offline / disconnected environments
    const fallback = {
      city: coords.name,
      temperature: 28,
      precipitation: 0,
      condition: 'Partly Cloudy',
      isRain: false,
      isGloomy: false,
      icon: '⛅',
      humidity: 60,
      fetchedAt: new Date(),
      isFallback: true,
    };
    return fallback;
  }
};

/**
 * Get calendar context (day of week, weekend proximity, festivals)
 */
const getCalendarContext = () => {
  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Sunday, 6 = Saturday
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[dayIndex];
  const isWeekend = dayIndex === 0 || dayIndex === 6;
  const isPreWeekend = dayIndex === 5; // Friday

  // Key upcoming business festival / events calendar context
  const month = now.getMonth(); // 0-indexed
  const upcomingEvents = [];
  if (month >= 8 && month <= 10) {
    upcomingEvents.push('Festive Season (Navratri / Diwali preparations)');
  }
  if (isWeekend) {
    upcomingEvents.push('Weekend Peak Shopping Window');
  } else if (isPreWeekend) {
    upcomingEvents.push('Pre-Weekend Evening Traffic Surge');
  }

  return {
    dayName,
    isWeekend,
    isPreWeekend,
    upcomingEvents,
    formattedDate: now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }),
  };
};

/**
 * Check relevance between external conditions and merchant business
 */
const evaluateContextRelevance = (merchant, weather, calendar) => {
  const type = merchant.businessType || 'other';
  const opportunities = [];

  // Scenario 1: Cafe / Restaurant + Rainy or Gloomy Weather
  if ((type === 'cafe' || type === 'restaurant') && (weather.isRain || weather.isGloomy || weather.precipitation > 0)) {
    opportunities.push({
      type: 'WEATHER_DEMAND',
      relevance: 'HIGH',
      title: 'Rain / Cold Weather Beverage Opportunity',
      summary: `${weather.condition} in ${weather.city} (${weather.temperature}°C). Historical pattern shows elevated hot drink & snack demand.`,
      recommendedAction: 'Promote a warm beverage combo (e.g. Masala Chai + Snack or Warm Cappuccino + Croissant) during afternoon/evening.',
      confidence: 0.88,
    });
  }

  // Scenario 2: Kirana / Retail + Weekend
  if ((type === 'kirana' || type === 'retail') && (calendar.isWeekend || calendar.isPreWeekend)) {
    opportunities.push({
      type: 'WEEKEND_RUSH',
      relevance: 'HIGH',
      title: 'Weekend Grocery & Staples Replenishment Rush',
      summary: `${calendar.dayName} marks the peak household shopping period. Footfall is consistently 2x higher than mid-week.`,
      recommendedAction: 'Ensure high-velocity dairy, staples, and impulse snacks are prominently displayed and stocked at the counter.',
      confidence: 0.92,
    });
  }

  // Scenario 3: Salon / Service + Pre-weekend or Weekend
  if (type === 'salon' && (calendar.isWeekend || calendar.isPreWeekend)) {
    opportunities.push({
      type: 'WEEKEND_APPOINTMENT_SURGE',
      relevance: 'HIGH',
      title: 'Weekend Self-Care & Grooming Demand Surge',
      summary: `${calendar.dayName} appointments typically reach 90%+ capacity for hair and skincare services.`,
      recommendedAction: 'Send slot-booking reminders to repeat customers and offer head massage add-ons to haircut appointments.',
      confidence: 0.9,
    });
  }

  // Scenario 4: General Evening Rain or Event
  if (weather.isRain && opportunities.length === 0) {
    opportunities.push({
      type: 'WEATHER_CAUTION',
      relevance: 'MEDIUM',
      title: 'Rain Impact on Walk-in Footfall',
      summary: `${weather.condition} may reduce physical walk-ins in ${weather.city}.`,
      recommendedAction: 'Consider digital payment discounts or delivery/takeaway incentives to offset lower in-store traffic.',
      confidence: 0.75,
    });
  }

  return {
    weather,
    calendar,
    opportunities,
    hasRelevantSignals: opportunities.length > 0,
  };
};

/**
 * Get comprehensive context for a merchant
 */
const getMerchantContext = async (merchant) => {
  const city = merchant.location?.city || 'Bengaluru';
  const weather = await fetchCityWeather(city);
  const calendar = getCalendarContext();
  const evaluation = evaluateContextRelevance(merchant, weather, calendar);

  return evaluation;
};

module.exports = {
  fetchCityWeather,
  getCalendarContext,
  evaluateContextRelevance,
  getMerchantContext,
};