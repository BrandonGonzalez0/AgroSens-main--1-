export async function fetchWeatherFor(lat, lon) {
  // Usaremos Open-Meteo para obtener temperatura actual y condiciones.
  // Docs: https://open-meteo.com/
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json || !json.current_weather) throw new Error('No weather data');
  // Open-Meteo devuelve current_weather: { temperature, windspeed, weathercode }
  const { temperature, weathercode } = json.current_weather;
  const description = mapWeatherCodeToText(weathercode);
  const icon = mapWeatherCodeToIcon(weathercode);
  return { temperature, description, icon, raw: json };
}

function mapWeatherCodeToText(code) {
  // Mapping simplificado basado en WMO codes usados por Open-Meteo
  const map = {
    0: 'Cielo despejado',
    1: 'Principalmente despejado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Niebla',
    48: 'Depósitos de hielo',
    51: 'Llovizna ligera',
    53: 'Llovizna moderada',
    55: 'Llovizna intensa',
    61: 'Lluvia ligera',
    63: 'Lluvia moderada',
    65: 'Lluvia intensa',
    71: 'Nieve ligera',
    73: 'Nieve moderada',
    75: 'Nieve intensa',
    95: 'Tormenta',
    99: 'Granizo'
  };
  return map[code] || `Código ${code}`;
}

function mapWeatherCodeToIcon(code) {
  // Emoji simple mapping
  const map = {
    0: '☀️',
    1: '🌤️',
    2: '⛅',
    3: '☁️',
    45: '🌫️',
    48: '🌫️',
    51: '🌦️',
    53: '🌦️',
    55: '🌧️',
    61: '🌧️',
    63: '🌧️',
    65: '⛈️',
    71: '❄️',
    73: '❄️',
    75: '❄️',
    95: '⛈️',
    99: '🌩️'
  };
  return map[code] || '🌡️';
}
