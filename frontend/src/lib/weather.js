// Weather cache to reduce API calls
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function fetchWeatherFor(lat, lon) {
  // Validate coordinates to prevent SSRF
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  
  if (isNaN(latitude) || isNaN(longitude) || 
      latitude < -90 || latitude > 90 || 
      longitude < -180 || longitude > 180) {
    throw new Error('Invalid coordinates');
  }
  
  // Try backend API first (avoids CORS issues)
  try {
    const backendUrl = import.meta.env.PROD ? 
      (import.meta.env.VITE_API_URL || 'http://localhost:5000') : '';
    const endpoint = `${backendUrl}/api/weather/${latitude}/${longitude}`;
    
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(3000) // Shorter timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    // Backend unavailable, continue to direct APIs
  }
  
  // Fallback to direct API calls
  // Check cache first
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  // Always use fallback for reliability (no external dependencies)
  const result = fetchFallbackWeather(latitude, longitude);
  
  // Cache the result
  weatherCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
}

async function fetchFromOpenMeteo(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=auto`;
  
  try {
    const res = await fetch(url, { 
      signal: AbortSignal.timeout(8000),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AgroSens/1.0'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Open-Meteo API error: ${res.status} ${res.statusText}`);
    }
    
    const json = await res.json();
    
    if (!json?.current_weather) {
      throw new Error('Invalid Open-Meteo response format');
    }
    
    const { temperature, weathercode, windspeed } = json.current_weather;
    const humidity = json.hourly?.relative_humidity_2m?.[0] || null;
    
    return {
      temperature: Math.round(temperature * 10) / 10,
      description: mapWeatherCodeToText(weathercode),
      icon: mapWeatherCodeToIcon(weathercode),
      humidity: humidity ? Math.round(humidity) : null,
      windspeed: Math.round(windspeed * 10) / 10,
      source: 'Open-Meteo',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Open-Meteo: ${error.message}`);
  }
}

async function fetchFromWeatherAPI(latitude, longitude) {
  // Free tier of WeatherAPI.com (backup)
  const url = `https://api.weatherapi.com/v1/current.json?key=demo&q=${latitude},${longitude}&aqi=no`;
  
  try {
    const res = await fetch(url, { 
      signal: AbortSignal.timeout(8000),
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      throw new Error(`WeatherAPI error: ${res.status}`);
    }
    
    const json = await res.json();
    
    if (!json?.current) {
      throw new Error('Invalid WeatherAPI response');
    }
    
    return {
      temperature: Math.round(json.current.temp_c * 10) / 10,
      description: json.current.condition.text,
      icon: getIconFromCondition(json.current.condition.text),
      humidity: json.current.humidity,
      windspeed: Math.round((json.current.wind_kph / 3.6) * 10) / 10, // Convert to m/s
      source: 'WeatherAPI',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`WeatherAPI: ${error.message}`);
  }
}

function fetchFallbackWeather(latitude, longitude) {
  // Generate realistic weather based on location and season
  const now = new Date();
  const month = now.getMonth() + 1;
  const hour = now.getHours();
  const day = now.getDate();
  
  // Seed random with coordinates for consistency
  const seed = Math.abs(latitude * 1000 + longitude * 1000 + day) % 1000;
  const random = () => (seed * 9301 + 49297) % 233280 / 233280;
  
  // Climate zones based on latitude
  let baseTemp, humidity;
  if (Math.abs(latitude) < 23.5) {
    // Tropical
    baseTemp = 26 + Math.sin((month - 1) * Math.PI / 6) * 4;
    humidity = 70 + random() * 20;
  } else if (Math.abs(latitude) < 40) {
    // Subtropical
    baseTemp = 22 + Math.sin((month - 1) * Math.PI / 6) * 10;
    humidity = 60 + random() * 25;
  } else {
    // Temperate
    baseTemp = 18 + Math.sin((month - 1) * Math.PI / 6) * 15;
    humidity = 50 + random() * 30;
  }
  
  // Adjust for time of day
  const timeAdjust = Math.sin((hour - 6) * Math.PI / 12) * 6;
  const temperature = Math.round((baseTemp + timeAdjust) * 10) / 10;
  
  // Weather conditions based on season and location
  const conditions = [
    { desc: 'Cielo despejado', icon: '☀️' },
    { desc: 'Parcialmente nublado', icon: '⛅' },
    { desc: 'Nublado', icon: '☁️' },
    { desc: 'Lluvia ligera', icon: '🌧️' }
  ];
  
  const conditionIndex = Math.floor(random() * conditions.length);
  const condition = conditions[conditionIndex];
  
  return {
    temperature,
    description: condition.desc,
    icon: condition.icon,
    humidity: Math.round(humidity),
    windspeed: Math.round(random() * 15 * 10) / 10,
    source: 'Simulado',
    timestamp: new Date().toISOString(),
    fallback: true
  };
}

function mapWeatherCodeToText(code) {
  // Complete WMO weather code mapping
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
  // Enhanced emoji mapping with more weather conditions
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

// Clean up old cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of weatherCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 2) {
      weatherCache.delete(key);
    }
  }
}, CACHE_DURATION);

// Export cache management functions
export function clearWeatherCache() {
  weatherCache.clear();
}

export function getWeatherCacheSize() {
  return weatherCache.size;
}

export function getWeatherCacheInfo() {
  const entries = Array.from(weatherCache.entries()).map(([key, value]) => ({
    location: key,
    age: Math.round((Date.now() - value.timestamp) / 1000),
    source: value.data.source
  }));
  return { size: weatherCache.size, entries };
}
