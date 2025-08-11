import axios from "axios";

// You'll need to get your free API key from https://openweathermap.org/api
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

console.log('OpenWeather API Key loaded:', OPENWEATHER_API_KEY ? 'Yes' : 'No');

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  rainChance: number;
  description: string;
  icon: string;
}

export interface BallparkLocation {
  name: string;
  lat: number;
  lon: number;
}

// MLB ballpark coordinates
const BALLPARK_LOCATIONS: { [key: string]: BallparkLocation } = {
  "Yankee Stadium": { name: "Yankee Stadium", lat: 40.8296, lon: -73.9262 },
  "Fenway Park": { name: "Fenway Park", lat: 42.3467, lon: -71.0972 },
  "Camden Yards": { name: "Camden Yards", lat: 39.2839, lon: -76.6218 },
  "Tropicana Field": { name: "Tropicana Field", lat: 27.7682, lon: -82.6534 },
  "Rogers Centre": { name: "Rogers Centre", lat: 43.6414, lon: -79.3894 },
  "Progressive Field": {
    name: "Progressive Field",
    lat: 41.4962,
    lon: -81.6852,
  },
  "Comerica Park": { name: "Comerica Park", lat: 42.339, lon: -83.0487 },
  "Guaranteed Rate Field": {
    name: "Guaranteed Rate Field",
    lat: 41.83,
    lon: -87.6338,
  },
  "Kauffman Stadium": { name: "Kauffman Stadium", lat: 39.0517, lon: -94.4803 },
  "Target Field": { name: "Target Field", lat: 44.9817, lon: -93.2781 },
  "Minute Maid Park": { name: "Minute Maid Park", lat: 29.757, lon: -95.3553 },
  "Angel Stadium": { name: "Angel Stadium", lat: 33.8003, lon: -117.8827 },
  "Oakland Coliseum": {
    name: "Oakland Coliseum",
    lat: 37.7516,
    lon: -122.2005,
  },
  "T-Mobile Park": { name: "T-Mobile Park", lat: 47.5914, lon: -122.3326 },
  "Globe Life Field": { name: "Globe Life Field", lat: 32.7473, lon: -97.0814 },
  "Truist Park": { name: "Truist Park", lat: 33.8906, lon: -84.4677 },
  "LoanDepot park": { name: "LoanDepot park", lat: 25.7781, lon: -80.2197 },
  "Citi Field": { name: "Citi Field", lat: 40.7571, lon: -73.8458 },
  "Citizens Bank Park": {
    name: "Citizens Bank Park",
    lat: 39.0961,
    lon: -75.1665,
  },
  "Nationals Park": { name: "Nationals Park", lat: 38.873, lon: -77.0074 },
  "Wrigley Field": { name: "Wrigley Field", lat: 41.9484, lon: -87.6553 },
  "Great American Ball Park": {
    name: "Great American Ball Park",
    lat: 39.0975,
    lon: -84.5061,
  },
  "American Family Field": {
    name: "American Family Field",
    lat: 43.028,
    lon: -87.9712,
  },
  "PNC Park": { name: "PNC Park", lat: 40.4469, lon: -80.0057 },
  "Busch Stadium": { name: "Busch Stadium", lat: 38.6226, lon: -90.1928 },
  "Coors Field": { name: "Coors Field", lat: 39.7559, lon: -104.9942 },
  "Chase Field": { name: "Chase Field", lat: 33.4453, lon: -112.0667 },
  "Dodger Stadium": { name: "Dodger Stadium", lat: 34.0739, lon: -118.24 },
  "Petco Park": { name: "Petco Park", lat: 32.7073, lon: -117.1566 },
  "Oracle Park": { name: "Oracle Park", lat: 37.7786, lon: -122.3893 },
  // Additional ballpark name variations
  "Rate Field": { name: "Guaranteed Rate Field", lat: 41.83, lon: -87.6338 },
  "Daikin Park": { name: "Angel Stadium", lat: 33.8003, lon: -117.8827 },
  "Sutter Health Park": { name: "Sutter Health Park", lat: 38.5816, lon: -121.4944 },
};

export const getWeatherForVenue = async (
  venueName: string,
): Promise<WeatherData | null> => {
  try {
    const location = BALLPARK_LOCATIONS[venueName];
    if (!location) {
      console.warn(`No coordinates found for venue: ${venueName}`);
      return null;
    }

    if (!OPENWEATHER_API_KEY) {
      console.error("OpenWeather API key is not set. Please set EXPO_PUBLIC_OPENWEATHER_API_KEY in your secrets.");
      return null;
    }

    const response = await axios.get(
      `${OPENWEATHER_BASE_URL}/weather?lat=${location.lat}&lon=${location.lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`,
    );

    const data = response.data;

    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind?.speed || 0),
      windDirection: data.wind?.deg || 0,
      rainChance: data.clouds?.all || 0, // Using cloud coverage as rain indicator
      description: data.weather[0]?.description || "",
      icon: data.weather[0]?.icon || "01d",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response && error.response.status === 401) {
        console.error("Error fetching weather data: Unauthorized. Please check your OpenWeather API key.");
      } else {
        console.error("Error fetching weather data:", error.message);
      }
    } else {
      console.error("An unexpected error occurred:", error);
    }
    return null;
  }
};

export const getWindDirectionText = (degrees: number): string => {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};