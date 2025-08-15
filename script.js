// --- CONFIGURATION ---
// IMPORTANT: Replace with your own OpenWeatherMap API key.
const WEATHER_API_KEY = "dbe4f773e57842fde24fc889a6bdad1d"; 

// --- DOM ELEMENTS ---
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const weatherContainer = document.getElementById('weatherContainer');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// --- EVENT LISTENERS ---
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherByCity(city);
    } else {
        showError("Please enter a city name.");
    }
});

cityInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        searchBtn.click();
    }
});

geoBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
        }, () => {
            showError("Unable to retrieve your location. Please allow location access or search for a city.");
        });
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});

// --- API CALLS & DATA HANDLING ---

/**
 * Checks if the API key is configured.
 * @returns {boolean} True if the key is configured, false otherwise.
 */
function isApiKeyConfigured() {
    if (WEATHER_API_KEY === "YOUR_OPENWEATHERMAP_API_KEY" || !WEATHER_API_KEY) {
        showError("Please configure the OpenWeatherMap API key in the script.");
        return false;
    }
    return true;
}

/**
 * Fetches weather data from OpenWeatherMap API by city name.
 * @param {string} city The name of the city.
 */
async function fetchWeatherByCity(city) {
    if (!isApiKeyConfigured()) return;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`;
    await fetchAndProcessWeather(url);
}

/**
 * Fetches weather data from OpenWeatherMap API by coordinates.
 * @param {number} lat Latitude.
 * @param {number} lon Longitude.
 */
async function fetchWeatherByCoords(lat, lon) {
    if (!isApiKeyConfigured()) return;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
    await fetchAndProcessWeather(url);
}

/**
 * Generic function to fetch weather data from a URL and update the UI.
 * @param {string} url The API endpoint URL.
 */
async function fetchAndProcessWeather(url) {
    hideError();
    weatherContainer.classList.add('hidden');
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 401) {
                 throw new Error("Invalid API key. Please check the key in the script.");
            }
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        updateUI(data);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        showError(`Could not fetch weather data. ${error.message}`);
    }
}

// --- UI UPDATES ---

/**
 * Updates the entire UI with new weather data.
 * @param {object} data The weather data object from OpenWeatherMap.
 */
function updateUI(data) {
    const { name, main, weather, wind, sys, dt, timezone } = data;

    document.getElementById('location').textContent = `${name}, ${sys.country}`;
    document.getElementById('temperature').textContent = `${Math.round(main.temp)}°C`;
    document.getElementById('description').textContent = weather[0].description;
    document.getElementById('feels-like').textContent = `${Math.round(main.feels_like)}°C`;
    document.getElementById('humidity').textContent = `${main.humidity}%`;
    document.getElementById('wind-speed').textContent = `${wind.speed.toFixed(1)} m/s`;
    document.getElementById('pressure').textContent = `${main.pressure} hPa`;

    // Corrected time calculation
    const utcMilliseconds = dt * 1000;
    const timezoneOffsetMilliseconds = timezone * 1000;
    const cityDate = new Date(utcMilliseconds + timezoneOffsetMilliseconds);

    const formattedTime = cityDate.toLocaleTimeString('en-US', {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
    });
    
    document.getElementById('current-time').textContent = formattedTime;

    // Update weather icon
    document.getElementById('weather-icon').innerHTML = getWeatherIcon(weather[0].main);

    weatherContainer.classList.remove('hidden');
}

/**
 * Returns an SVG icon based on the weather condition.
 * @param {string} condition The main weather condition (e.g., 'Clear', 'Clouds').
 * @returns {string} An HTML string for the SVG icon.
 */
function getWeatherIcon(condition) {
    switch (condition) {
        case 'Clear':
            return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#FFC107" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
        case 'Clouds':
            return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#F1F5F9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`;
        case 'Rain':
        case 'Drizzle':
            return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16.5c0-1.93-1.57-3.5-3.5-3.5-1.04 0-1.96.45-2.6.1.18-.32.28-.68.28-1.05 0-1.1-.9-2-2-2s-2 .9-2 2c0 .37.1.73.28 1.05-.64.35-1.56.1-2.6.1C6.57 13 5 14.57 5 16.5c0 1.93 1.57 3.5 3.5 3.5h9c1.93 0 3.5-1.57 3.5-3.5zM8 13v1m4-1v1m4-1v1"/></svg>`;
        case 'Thunderstorm':
            return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16.5c0-1.93-1.57-3.5-3.5-3.5-1.04 0-1.96.45-2.6.1.18-.32.28-.68.28-1.05 0-1.1-.9-2-2-2s-2 .9-2 2c0 .37.1.73.28 1.05-.64.35-1.56.1-2.6.1C6.57 13 5 14.57 5 16.5c0 1.93 1.57 3.5 3.5 3.5h9c1.93 0 3.5-1.57 3.5-3.5z"/><polyline points="13 11 10 16 13 16 11 21"/></svg>`;
        case 'Snow':
            return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17.58A5 5 0 0 0 15.07 13H9.58A5 5 0 0 0 5 17.58"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="12" y1="18" x2="12.01" y2="18"/><line x1="16" y1="16" x2="16.01" y2="16"/><line x1="10" y1="14" x2="10.01" y2="14"/><line x1="14" y1="14" x2="14.01" y2="14"/><line x1="12" y1="12" x2="12.01" y2="12"/></svg>`;
        default: // Mist, Smoke, Haze, Dust, Fog, Sand, Dust, Ash, Squall, Tornado
            return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
    }
}

/**
 * Displays an error message to the user.
 * @param {string} message The error message to display.
 */
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

/**
 * Hides the error message.
 */
function hideError() {
    errorMessage.classList.add('hidden');
}
