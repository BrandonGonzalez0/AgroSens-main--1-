import express from 'express';

const router = express.Router();

// Weather cache to reduce API calls
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// GET /api/weather/:lat/:lon - Get weather for coordinates
router.get('/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    // Check cache first
    const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({ ...cached.data, cached: true });
    }
    
    // Try multiple weather APIs
    const weatherData = await fetchWeatherData(latitude, longitude);
    
    // Cache successful result
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });
    
    res.json(weatherData);
    
  } catch (error) {
    console.error('Weather API error:', error);
    
    // Try to return cached data if available (even if expired)
    const { lat, lon } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const cached = weatherCache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached.data, expired: true, cached: true });
    }
    
    res.status(500).json({ 
      error: 'Weather service unavailable',
      message: error.message 
    });
  }
});

// GET /api/weather/cache/info - Get cache information
router.get('/cache/info', (req, res) => {
  const entries = Array.from(weatherCache.entries()).map(([key, value]) => ({
    location: key,
    age: Math.round((Date.now() - value.timestamp) / 1000),
    source: value.data.source
  }));
  
  res.json({ 
    size: weatherCache.size, 
    entries,
    cacheHits: entries.length
  });
});

// DELETE /api/weather/cache - Clear weather cache
router.delete('/cache', (req, res) => {
  weatherCache.clear();
  res.json({ message: 'Weather cache cleared', size: 0 });
});

async function fetchWeatherData(latitude, longitude) {
  // Try multiple APIs in order of preference
  const apis = [
    () => fetchFromOpenMeteo(latitude, longitude),
    () => fetchFromWeatherAPI(latitude, longitude),
    () => generateFallbackWeather(latitude, longitude)
  ];
  
  for (const apiCall of apis) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn('Weather API failed, trying next:', error.message);
      continue;
    }
  }
  
  throw new Error('All weather APIs failed');
}

async function fetchFromOpenMeteo(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=auto`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AgroSens/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data?.current_weather) {
      throw new Error('Invalid Open-Meteo response format');
    }
    
    const { temperature, weathercode, windspeed } = data.current_weather;
    const humidity = data.hourly?.relative_humidity_2m?.[0] || null;
    
    return {
      temperature: Math.round(temperature * 10) / 10,
      description: mapWeatherCodeToText(weathercode),
      icon: mapWeatherCodeToIcon(weathercode),
      humidity: humidity ? Math.round(humidity) : null,
      windspeed: Math.round(windspeed * 10) / 10,
      source: 'Open-Meteo',
      timestamp: new Date().toISOString(),
      coordinates: { latitude, longitude }
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw new Error(`Open-Meteo: ${error.message}`);
  }
}

async function fetchFromWeatherAPI(latitude, longitude) {
  // Using demo key - in production, use environment variable
  const apiKey = process.env.WEATHER_API_KEY || 'demo';
  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${latitude},${longitude}&aqi=no`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`WeatherAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data?.current) {
      throw new Error('Invalid WeatherAPI response');
    }
    
    return {
      temperature: data.current.temp_c,
      description: data.current.condition.text,
      icon: getIconFromCondition(data.current.condition.text),
      humidity: data.current.humidity,
      windspeed: Math.round((data.current.wind_kph / 3.6) * 10) / 10, // Convert to m/s
      source: 'WeatherAPI',
      timestamp: new Date().toISOString(),
      coordinates: { latitude, longitude }
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw new Error(`WeatherAPI: ${error.message}`);
  }
}

function generateFallbackWeather(latitude, longitude) {
  // Generate realistic weather based on location and season
  const now = new Date();
  const month = now.getMonth() + 1;
  const hour = now.getHours();
  
  // Basic climate zones based on latitude
  let baseTemp;
  if (Math.abs(latitude) < 23.5) {
    // Tropical
    baseTemp = 25 + Math.sin((month - 1) * Math.PI / 6) * 3;
  } else if (Math.abs(latitude) < 40) {
    // Subtropical  
    baseTemp = 20 + Math.sin((month - 1) * Math.PI / 6) * 8;
  } else {
    // Temperate
    baseTemp = 15 + Math.sin((month - 1) * Math.PI / 6) * 12;
  }
  
  // Adjust for time of day
  const timeAdjust = Math.sin((hour - 6) * Math.PI / 12) * 5;
  const temperature = Math.round((baseTemp + timeAdjust) * 10) / 10;
  
  // Random weather conditions
  const conditions = [
    { desc: 'Cielo despejado', icon: '☀️', code: 0 },
    { desc: 'Parcialmente nublado', icon: '⛅', code: 2 },
    { desc: 'Nublado', icon: '☁️', code: 3 },
    { desc: 'Lluvia ligera', icon: '🌧️', code: 61 }
  ];
  
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  return {
    temperature,
    description: condition.desc,
    icon: condition.icon,
    humidity: Math.round(50 + Math.random() * 30),
    windspeed: Math.round(Math.random() * 10 * 10) / 10,
    source: 'Simulado',
    timestamp: new Date().toISOString(),
    coordinates: { latitude, longitude },
    fallback: true
  };
}

function mapWeatherCodeToText(code) {
  const map = {
    0: 'Cielo despejado', 1: 'Principalmente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Niebla', 48: 'Depósitos de hielo', 51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna intensa',
    56: 'Llovizna helada ligera', 57: 'Llovizna helada intensa', 61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia intensa',
    66: 'Lluvia helada ligera', 67: 'Lluvia helada intensa', 71: 'Nieve ligera', 73: 'Nieve moderada', 75: 'Nieve intensa',
    77: 'Granulos de nieve', 80: 'Chubascos ligeros', 81: 'Chubascos moderados', 82: 'Chubascos intensos',
    85: 'Chubascos de nieve ligeros', 86: 'Chubascos de nieve intensos', 95: 'Tormenta', 96: 'Tormenta con granizo ligero', 99: 'Tormenta con granizo intenso'
  };
  return map[code] || `Condición desconocida (${code})`;
}

function mapWeatherCodeToIcon(code) {
  const map = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌧️',
    56: '🌨️', 57: '🌨️', 61: '🌧️', 63: '🌧️', 65: '⛈️',
    66: '🌨️', 67: '🌨️', 71: '❄️', 73: '❄️', 75: '❄️',
    77: '🌨️', 80: '🌦️', 81: '🌧️', 82: '⛈️',
    85: '🌨️', 86: '❄️', 95: '⛈️', 96: '🌩️', 99: '🌩️'
  };
  return map[code] || '🌡️';
}

function getIconFromCondition(condition) {
  const text = condition.toLowerCase();
  if (text.includes('sunny') || text.includes('clear')) return '☀️';
  if (text.includes('partly') || text.includes('partial')) return '⛅';
  if (text.includes('cloudy') || text.includes('overcast')) return '☁️';
  if (text.includes('rain') || text.includes('shower')) return '🌧️';
  if (text.includes('storm') || text.includes('thunder')) return '⛈️';
  if (text.includes('snow') || text.includes('blizzard')) return '❄️';
  if (text.includes('fog') || text.includes('mist')) return '🌫️';
  if (text.includes('drizzle')) return '🌦️';
  return '🌡️';
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of weatherCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 2) {
      weatherCache.delete(key);
    }
  }
}, CACHE_DURATION);

export default router;