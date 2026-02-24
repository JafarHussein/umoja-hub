/**
 * OpenWeatherMap weather service.
 * Resolves a Kenyan county name to lat/lon via geocoding,
 * then fetches a 7-day forecast summary.
 * Returns null on any failure — assistant continues without weather context.
 */

import { env } from '@/lib/env';
import { logger } from '@/lib/utils';
import type { WeatherContext } from '@/lib/foodhub/assistantPrompt';

interface GeocodingResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
}

interface ForecastDay {
  dt: number;
  temp: { day: number; min: number; max: number };
  weather: Array<{ description: string }>;
  humidity: number;
  pop: number; // probability of precipitation
}

interface OneCallResponse {
  daily?: ForecastDay[];
}

const COUNTY_GEOCODE_OVERRIDES: Record<string, { lat: number; lon: number }> = {
  Nairobi: { lat: -1.2921, lon: 36.8219 },
  Mombasa: { lat: -4.0435, lon: 39.6682 },
  Kisumu: { lat: -0.0917, lon: 34.7679 },
  Nakuru: { lat: -0.3031, lon: 36.08 },
  Eldoret: { lat: 0.5143, lon: 35.2698 },
  Kiambu: { lat: -1.1709, lon: 36.8357 },
  Meru: { lat: 0.047, lon: 37.649 },
  Kirinyaga: { lat: -0.5587, lon: 37.274 },
  Nyandarua: { lat: -0.5059, lon: 36.433 },
  'Uasin Gishu': { lat: 0.5143, lon: 35.2698 },
};

function formatForecast(daily: ForecastDay[]): string {
  const days = daily.slice(0, 7);
  const lines = days.map((day, i) => {
    const date = new Date(day.dt * 1000);
    const label = i === 0 ? 'Today' : date.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' });
    const desc = day.weather[0]?.description ?? 'no data';
    const tempMin = Math.round(day.temp.min);
    const tempMax = Math.round(day.temp.max);
    const rainChance = Math.round(day.pop * 100);
    return `${label}: ${desc}, ${tempMin}–${tempMax}°C, ${rainChance}% rain chance`;
  });
  return lines.join('\n');
}

export async function getCountyForecast(county: string): Promise<WeatherContext | null> {
  try {
    const apiKey = env('OPEN_WEATHER_MAP_API_KEY');

    // Use override if we have exact coordinates, otherwise geocode
    let lat: number;
    let lon: number;

    const override = COUNTY_GEOCODE_OVERRIDES[county];

    if (override) {
      lat = override.lat;
      lon = override.lon;
    } else {
      // Geocoding: county name + Kenya context
      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(county + ', Kenya')}&limit=1&appid=${apiKey}`;
      const geoRes = await fetch(geoUrl);

      if (!geoRes.ok) {
        logger.warn('weatherService', 'Geocoding request failed', { county, status: geoRes.status });
        return null;
      }

      const geoData = (await geoRes.json()) as GeocodingResult[];

      if (!geoData.length) {
        logger.warn('weatherService', 'County not found in geocoding', { county });
        return null;
      }

      lat = geoData[0]!.lat;
      lon = geoData[0]!.lon;
    }

    // One Call API 3.0 for 7-day daily forecast
    const forecastUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&units=metric&appid=${apiKey}`;
    const forecastRes = await fetch(forecastUrl);

    if (!forecastRes.ok) {
      logger.warn('weatherService', 'Forecast request failed', { county, status: forecastRes.status });
      return null;
    }

    const forecastData = (await forecastRes.json()) as OneCallResponse;

    if (!forecastData.daily?.length) {
      logger.warn('weatherService', 'No daily forecast data returned', { county });
      return null;
    }

    const forecast = formatForecast(forecastData.daily);
    return { county, forecast };
  } catch (error) {
    logger.error('weatherService', 'Failed to fetch county forecast', { county, error });
    return null;
  }
}
