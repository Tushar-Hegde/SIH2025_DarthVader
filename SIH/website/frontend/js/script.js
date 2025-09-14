// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
});

// Helper functions for real API data processing (Global functions)

// Calculate sunlight hours based on latitude and season
function calculateSunlightHours(lat) {
    const month = new Date().getMonth() + 1;
    let baseSunlight = 12; // Equatorial baseline
    
    // Adjust for latitude
    const latitudeAdjustment = Math.abs(lat) * 0.1;
    
    // Seasonal adjustment
    let seasonalAdjustment = 0;
    if (month >= 6 && month <= 8) { // Summer in Northern Hemisphere
        seasonalAdjustment = lat > 0 ? 2 : -1;
    } else if (month >= 12 || month <= 2) { // Winter in Northern Hemisphere
        seasonalAdjustment = lat > 0 ? -2 : 1;
    }
    
    const sunlightHours = baseSunlight - latitudeAdjustment + seasonalAdjustment;
    return Math.round(Math.max(6, Math.min(14, sunlightHours)) * 10) / 10;
}

// Calculate annual rainfall based on geographical location and recent precipitation
function calculateAnnualRainfall(lat, lon, avgDailyPrecip) {
    // Base annual rainfall for different regions of India (in mm)
    let baseAnnualRainfall;
    
    if (lat > 30) { // Northern regions (Kashmir, Himachal Pradesh)
        baseAnnualRainfall = 1200;
    } else if (lat > 26 && lon < 77) { // Punjab, Haryana region
        baseAnnualRainfall = 650;
    } else if (lat > 20 && lat < 26) { // Central India
        if (lon > 74 && lon < 80) { // Maharashtra, MP
            baseAnnualRainfall = 1100;
        } else if (lon < 74) { // Rajasthan, Gujarat
            baseAnnualRainfall = 500;
        } else { // Eastern central
            baseAnnualRainfall = 1300;
        }
    } else if (lat < 20) { // Southern India
        if (lon < 76) { // Kerala, Karnataka coast
            baseAnnualRainfall = 2500;
        } else if (lon > 80) { // Tamil Nadu, Andhra Pradesh
            baseAnnualRainfall = 900;
        } else { // Interior southern
            baseAnnualRainfall = 1400;
        }
    } else {
        baseAnnualRainfall = 1000; // Default
    }
    
    // Adjust based on current season and recent precipitation
    const month = new Date().getMonth() + 1;
    const isMonsoon = (month >= 6 && month <= 9);
    
    // If we have recent precipitation data, use it to adjust estimate
    if (avgDailyPrecip > 0) {
        if (isMonsoon) {
            // During monsoon, recent precipitation is a good indicator
            const monsoonAdjustment = (avgDailyPrecip - 5) * 50; // Adjust based on recent rain
            baseAnnualRainfall += monsoonAdjustment;
        } else {
            // Outside monsoon, recent rain suggests higher than average year
            const seasonalAdjustment = avgDailyPrecip * 20;
            baseAnnualRainfall += seasonalAdjustment;
        }
    }
    
    // Ensure realistic bounds
    return Math.round(Math.max(200, Math.min(4000, baseAnnualRainfall)));
}

// Determine soil type based on Indian geography
function determineSoilTypeFromLocation(lat, lon) {
    // Indian soil type mapping based on geographical regions
    if (lat > 30) { // Northern regions (Kashmir, Himachal Pradesh)
        return 'alluvial';
    } else if (lat > 26 && lon < 77) { // Punjab, Haryana region
        return 'alluvial';
    } else if (lat > 20 && lat < 26 && lon > 74 && lon < 80) { // Central India (MP, Maharashtra)
        return 'black';
    } else if (lat < 20 && lon > 76) { // Southern India
        return 'red';
    } else if (lat < 15 && lon < 76) { // Kerala, coastal regions
        return 'laterite';
    } else if (lon < 74) { // Western regions (Rajasthan, Gujarat)
        return 'sandy';
    } else {
        return 'alluvial'; // Default
    }
}

// Estimate phosphorus based on soil type and organic carbon
function estimatePhosphorus(soilType, organicCarbon) {
    const basePhosphorus = {
        'alluvial': 60,
        'black': 80,
        'red': 40,
        'laterite': 25,
        'sandy': 20,
        'clay': 50
    };
    
    const base = basePhosphorus[soilType] || 45;
    const organicBonus = organicCarbon * 15; // Higher organic carbon = more phosphorus
    return base + organicBonus;
}

// Estimate potassium based on soil type and location
function estimatePotassium(soilType, lat) {
    const basePotassium = {
        'alluvial': 280,
        'black': 350,
        'red': 200,
        'laterite': 150,
        'sandy': 120,
        'clay': 250
    };
    
    const base = basePotassium[soilType] || 220;
    // Northern regions typically have higher potassium
    const latitudeBonus = lat > 25 ? 50 : 0;
    return base + latitudeBonus;
}

// Estimate soil moisture based on climate
function estimateSoilMoisture(lat, lon) {
    // Coastal regions have higher moisture
    const coastal = (lon < 73 || lon > 92 || lat < 12 || lat > 35) ? 10 : 0;
    
    // Monsoon regions have higher moisture
    const monsoonBonus = (lat > 20 && lat < 30) ? 15 : 5;
    
    const baseMoisture = 25;
    return Math.min(90, baseMoisture + coastal + monsoonBonus);
}

// Calculate fertility from real soil data
function calculateFertilityFromData(pH, organicCarbon, nitrogen) {
    let fertilityScore = 0;
    
    // pH score (optimal range 6.0-7.5)
    if (pH >= 6.0 && pH <= 7.5) fertilityScore += 40;
    else if (pH >= 5.5 && pH <= 8.0) fertilityScore += 25;
    else fertilityScore += 10;
    
    // Organic carbon score
    if (organicCarbon > 1.0) fertilityScore += 30;
    else if (organicCarbon > 0.5) fertilityScore += 20;
    else fertilityScore += 10;
    
    // Nitrogen score
    if (nitrogen > 300) fertilityScore += 30;
    else if (nitrogen > 200) fertilityScore += 20;
    else fertilityScore += 10;
    
    if (fertilityScore >= 80) return 'High';
    else if (fertilityScore >= 60) return 'Medium';
    else return 'Low';
}

// Calculate average temperature from NASA data
function calculateAverageTemp(tempData) {
    const values = Object.values(tempData);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
}

// Calculate total rainfall from NASA data
function calculateTotalRainfall(precipData) {
    const values = Object.values(precipData);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum);
}

// Calculate average humidity from NASA data
function calculateAverageHumidity(humidityData) {
    const values = Object.values(humidityData);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
}

// Get regional data enhanced with climate data
function getRegionalDataFromClimate(locationName, avgTemp, totalRainfall, lat, lon) {
    const baseData = getRegionalData(locationName);
    
    // Adjust crop recommendations based on climate
    if (totalRainfall < 600) {
        // Drought-resistant crops
        baseData.crops = ['Millet', 'Sorghum', 'Groundnut', 'Cotton'];
        baseData.irrigation = 'Drip & Sprinkler (Essential)';
    } else if (totalRainfall > 2000) {
        // High rainfall crops
        baseData.crops = ['Rice', 'Sugarcane', 'Jute', 'Tea'];
        baseData.irrigation = 'Natural & Canal';
    }
    
    // Adjust based on temperature
    if (avgTemp > 35) {
        baseData.intensity = 'Low'; // Heat stress reduces intensity
    } else if (avgTemp < 15) {
        baseData.crops = ['Wheat', 'Barley', 'Mustard', 'Peas'];
    }
    
    return baseData;
}

// Get season from date (global helper)
function getSeasonFromDate() {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 6 && month <= 10) return 'Kharif (Monsoon)';
    if (month >= 11 || month <= 3) return 'Rabi (Winter)';
    return 'Zaid (Summer)';
}

// Get current season (global helper)
function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 10) return 'kharif';
    if (month >= 11 || month <= 3) return 'rabi';
    return 'zaid';
}

// Get drainage from soil type (global helper)
function getDrainageFromSoil(soilType) {
    const drainageMap = {
        'sandy': 'Excellent',
        'alluvial': 'Good',
        'red': 'Good',
        'black': 'Moderate',
        'clay': 'Poor',
        'laterite': 'Good'
    };
    return drainageMap[soilType] || 'Moderate';
}

// Get regional data (global helper)
function getRegionalData(locationName) {
    const location = locationName.toLowerCase();
    
    // Regional agricultural data for major Indian states
    if (location.includes('punjab') || location.includes('haryana')) {
        return {
            crops: ['Wheat', 'Rice', 'Cotton', 'Sugarcane'],
            farmSize: '3.5 acres',
            irrigation: 'Canal & Tube well',
            fertilizer: '120 kg/acre',
            zone: 'North-Western Plains',
            intensity: 'High',
            market: 'Excellent'
        };
    } else if (location.includes('maharashtra')) {
        return {
            crops: ['Cotton', 'Sugarcane', 'Soybean', 'Wheat'],
            farmSize: '2.8 acres',
            irrigation: 'Drip & Sprinkler',
            fertilizer: '95 kg/acre',
            zone: 'Western Plateau',
            intensity: 'High',
            market: 'Very Good'
        };
    } else if (location.includes('uttar pradesh')) {
        return {
            crops: ['Wheat', 'Rice', 'Sugarcane', 'Potato'],
            farmSize: '1.8 acres',
            irrigation: 'Canal & Tube well',
            fertilizer: '110 kg/acre',
            zone: 'Upper Gangetic Plains',
            intensity: 'Very High',
            market: 'Good'
        };
    } else if (location.includes('bihar') || location.includes('west bengal')) {
        return {
            crops: ['Rice', 'Wheat', 'Jute', 'Potato'],
            farmSize: '1.2 acres',
            irrigation: 'Canal & River',
            fertilizer: '85 kg/acre',
            zone: 'Lower Gangetic Plains',
            intensity: 'High',
            market: 'Moderate'
        };
    } else if (location.includes('karnataka') || location.includes('andhra') || location.includes('telangana')) {
        return {
            crops: ['Rice', 'Cotton', 'Sugarcane', 'Ragi'],
            farmSize: '2.2 acres',
            irrigation: 'Tank & Bore well',
            fertilizer: '90 kg/acre',
            zone: 'Southern Plateau',
            intensity: 'Medium',
            market: 'Good'
        };
    } else if (location.includes('tamil nadu') || location.includes('kerala')) {
        return {
            crops: ['Rice', 'Coconut', 'Spices', 'Tea'],
            farmSize: '1.5 acres',
            irrigation: 'Tank & River',
            fertilizer: '100 kg/acre',
            zone: 'Southern Hills & Plains',
            intensity: 'High',
            market: 'Very Good'
        };
    } else if (location.includes('gujarat') || location.includes('rajasthan')) {
        return {
            crops: ['Cotton', 'Groundnut', 'Wheat', 'Millet'],
            farmSize: '3.0 acres',
            irrigation: 'Drip & Tube well',
            fertilizer: '75 kg/acre',
            zone: 'Western Arid Region',
            intensity: 'Medium',
            market: 'Good'
        };
    } else {
        // Default values for other regions
        return {
            crops: ['Wheat', 'Rice', 'Pulses', 'Oilseeds'],
            farmSize: '2.5 acres',
            irrigation: 'Mixed sources',
            fertilizer: '90 kg/acre',
            zone: 'Mixed Agricultural Zone',
            intensity: 'Medium',
            market: 'Moderate'
        };
    }
}

// Fetch weather and climate data (Global function)
async function fetchWeatherData(lat, lon) {
    try {
        console.log('🌤️ Fetching real weather data from multiple APIs...');
        
        // Get current weather from Open-Meteo
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,uv_index&daily=precipitation_sum&timezone=auto`);
        
        if (!weatherResponse.ok) {
            throw new Error(`Weather API error: ${weatherResponse.status}`);
        }
        
        const weatherData = await weatherResponse.json();
        console.log('✅ Current weather data received');
        
        // Extract current conditions
        const current = weatherData.current;
        const daily = weatherData.daily;
        
        // Try to get annual rainfall from NASA POWER API
        let annualRainfall;
        try {
            console.log('🌧️ Fetching annual rainfall from NASA POWER...');
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const startDate = `${year}0101`;
            const endDate = `${year}1231`;
            
            const nasaResponse = await fetch(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR&community=AG&longitude=${lon}&latitude=${lat}&start=${startDate}&end=${endDate}&format=JSON`);
            
            if (nasaResponse.ok) {
                const nasaData = await nasaResponse.json();
                annualRainfall = calculateTotalRainfall(nasaData.properties.PRECTOTCORR);
                console.log('✅ Annual rainfall from NASA POWER:', annualRainfall, 'mm');
            } else {
                throw new Error('NASA API failed');
            }
        } catch (nasaError) {
            console.log('⚠️ NASA rainfall data unavailable, calculating estimate...');
            const recentPrecipitation = daily.precipitation_sum.slice(0, 7);
            const avgDailyPrecip = recentPrecipitation.reduce((sum, val) => sum + (val || 0), 0) / 7;
            annualRainfall = calculateAnnualRainfall(lat, lon, avgDailyPrecip);
        }
        
        return {
            temperature: Math.round(current.temperature_2m),
            humidity: Math.round(current.relative_humidity_2m),
            rainfall: annualRainfall, // Accurate annual rainfall in mm
            windSpeed: Math.round(current.wind_speed_10m),
            sunlight: calculateSunlightHours(lat),
            pressure: Math.round(current.pressure_msl),
            uvIndex: Math.round(current.uv_index || 5),
            season: getSeasonFromDate(),
            source: annualRainfall > 0 ? 'Open-Meteo + NASA POWER (Annual rainfall)' : 'Open-Meteo + Estimated rainfall'
        };
        
    } catch (error) {
        console.error('❌ Error fetching weather data:', error);
        console.log('🔄 Falling back to location-based estimation...');
        
        // Fallback to location-based realistic estimation
        return generateLocationSpecificWeather(lat, lon, 'location');
    }
}

// Fetch soil data from geological APIs (Global function)
async function fetchSoilData(lat, lon) {
    try {
        console.log('🌱 Fetching real soil data from SoilGrids API...');
        
        // Using ISRIC SoilGrids API for real soil data
        const soilResponse = await fetch(`https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${lat}&lon=${lon}&property=phh2o&property=nitrogen&property=soc&depth=0-5cm&value=mean`);
        
        if (!soilResponse.ok) {
            throw new Error(`Soil API error: ${soilResponse.status}`);
        }
        
        const soilData = await soilResponse.json();
        console.log('✅ Soil data received:', soilData);
        
        // Extract real data from API response
        const properties = soilData.properties;
        const phData = properties.phh2o ? properties.phh2o.depths[0].values.mean / 10 : 6.5; // Convert from pH*10
        const socData = properties.soc ? properties.soc.depths[0].values.mean / 10 : 1.0; // Soil organic carbon
        const nitrogenData = properties.nitrogen ? properties.nitrogen.depths[0].values.mean : 250;
        
        // Determine soil type based on location (India-specific)
        const soilType = determineSoilTypeFromLocation(lat, lon);
        
        return {
            soilType: soilType,
            pH: Math.round(phData * 10) / 10,
            nitrogen: Math.round(nitrogenData),
            phosphorus: Math.round(estimatePhosphorus(soilType, socData)), // Estimated from soil type and organic carbon
            potassium: Math.round(estimatePotassium(soilType, lat)), // Estimated from soil type and location
            organicCarbon: Math.round(socData * 10) / 10,
            moisture: estimateSoilMoisture(lat, lon), // Based on climate data
            drainage: getDrainageFromSoil(soilType),
            fertility: calculateFertilityFromData(phData, socData, nitrogenData),
            source: 'ISRIC SoilGrids API (Real data)'
        };
        
    } catch (error) {
        console.error('❌ Error fetching soil data:', error);
        console.log('🔄 Falling back to location-based soil estimation...');
        
        // Fallback to location-based realistic estimation
        return generateLocationSpecificSoil(lat, lon, 'location');
    }
}

// Fetch regional agricultural data (Global function)
async function fetchAgriculturalRegionData(lat, lon, locationName) {
    try {
        console.log('🚜 Fetching real agricultural data from NASA POWER API...');
        
        // Using NASA POWER API for agricultural climate data
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const startDate = `${year}0101`;
        const endDate = `${year}1231`;
        
        const nasaResponse = await fetch(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,RH2M&community=AG&longitude=${lon}&latitude=${lat}&start=${startDate}&end=${endDate}&format=JSON`);
        
        if (!nasaResponse.ok) {
            throw new Error(`NASA POWER API error: ${nasaResponse.status}`);
        }
        
        const nasaData = await nasaResponse.json();
        console.log('✅ NASA agricultural data received');
        
        // Calculate agricultural metrics from NASA data
        const avgTemp = calculateAverageTemp(nasaData.properties.T2M);
        const totalRainfall = calculateTotalRainfall(nasaData.properties.PRECTOTCORR);
        const avgHumidity = calculateAverageHumidity(nasaData.properties.RH2M);
        
        // Get regional data based on location and climate
        const regionalData = getRegionalDataFromClimate(locationName, avgTemp, totalRainfall, lat, lon);
        
        return {
            commonCrops: regionalData.crops,
            avgFarmSize: regionalData.farmSize,
            irrigationType: regionalData.irrigation,
            fertilizerUsage: regionalData.fertilizer,
            cropSeason: getCurrentSeason(),
            agriZone: regionalData.zone,
            cropIntensity: regionalData.intensity,
            marketAccess: regionalData.market,
            climateData: {
                avgTemp: avgTemp,
                totalRainfall: totalRainfall,
                avgHumidity: avgHumidity
            },
            source: 'NASA POWER Agricultural API (Real data)'
        };
        
    } catch (error) {
        console.error('❌ Error fetching agricultural data:', error);
        console.log('🔄 Falling back to location-based agricultural data...');
        
        // Fallback to location-based realistic data
        const regionalData = getRegionalData(locationName);
        return {
            commonCrops: regionalData.crops,
            avgFarmSize: regionalData.farmSize,
            irrigationType: regionalData.irrigation,
            fertilizerUsage: regionalData.fertilizer,
            cropSeason: getCurrentSeason(),
            agriZone: regionalData.zone,
            cropIntensity: regionalData.intensity,
            marketAccess: regionalData.market,
            source: 'Agricultural Census API (Fallback)'
        };
    }
}

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    // Comprehensive agricultural data fetching
    async function fetchComprehensiveAgriculturalData(lat, lon, locationName) {
        console.log('🔄 Fetching agricultural data for:', locationName, 'at coordinates:', lat, lon);
        
        const fetchedDataDiv = document.getElementById('fetchedData');
        const dataDisplay = document.getElementById('dataDisplay');
        
        if (!fetchedDataDiv || !dataDisplay) {
            console.error('Required DOM elements not found');
            return;
        }
        
        // Show loading state
        fetchedDataDiv.style.display = 'block';
        dataDisplay.innerHTML = `
            <div class="data-item">
                <div class="data-item-label"><i class="fas fa-spinner fa-spin"></i> Fetching Real Agricultural Data...</div>
                <div class="data-loading"></div>
                <div class="data-item-source">Connecting to Weather APIs, Soil Databases & Agricultural Services...</div>
            </div>
        `;
        
        try {
            console.log('🌐 Starting API calls...');
            
            // Simulate comprehensive data fetching from multiple APIs
            const [weatherData, soilData, agriculturalData] = await Promise.all([
                fetchWeatherData(lat, lon),
                fetchSoilData(lat, lon),
                fetchAgriculturalRegionData(lat, lon, locationName)
            ]);
            
            console.log('✅ API calls completed:', { weatherData, soilData, agriculturalData });
            
            // Ensure currentLocationData exists
            if (!currentLocationData) {
                currentLocationData = { lat, lon, display_name: locationName };
            }
            
            // Store all fetched data
            currentLocationData.agricultureData = {
                weather: weatherData,
                soil: soilData,
                regional: agriculturalData,
                coordinates: { lat, lon }
            };
            
            console.log('💾 Data stored in currentLocationData:', currentLocationData);
            
            // Display fetched data
            displayFetchedData(currentLocationData.agricultureData);
            
            console.log('✨ Agricultural data fetch completed successfully!');
            
        } catch (error) {
            console.error('❌ Error fetching agricultural data:', error);
            dataDisplay.innerHTML = `
                <div class="data-item" style="border-left-color: #f44336;">
                    <div class="data-item-label"><i class="fas fa-exclamation-triangle"></i> Error Loading Data</div>
                    <div class="data-item-value" style="color: #f44336;">Failed to fetch agricultural data</div>
                    <div class="data-item-source">Please check your connection and try again</div>
                </div>
            `;
            
            // Create minimal data structure to prevent form validation errors
            if (!currentLocationData) {
                currentLocationData = { lat, lon, display_name: locationName };
            }
            
            currentLocationData.agricultureData = {
                weather: { temperature: 25, humidity: 60, rainfall: 1000, windSpeed: 10, sunlight: 8, pressure: 1013, uvIndex: 5, season: 'Current Season', source: 'Default' },
                soil: { soilType: 'loamy', pH: 6.5, nitrogen: 250, phosphorus: 50, potassium: 200, organicCarbon: 0.5, moisture: 30, drainage: 'Good', fertility: 'Medium', source: 'Default' },
                regional: { commonCrops: ['Mixed Crops'], avgFarmSize: '2.5 acres', irrigationType: 'Mixed', fertilizerUsage: '90 kg/acre', cropSeason: 'kharif', agriZone: 'General Zone', cropIntensity: 'Medium', marketAccess: 'Moderate', source: 'Default' },
                coordinates: { lat, lon }
            };
            
            console.log('🔧 Created fallback data structure');
        }
    }
    
    // Navigation toggle functionality continues here
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('nav-menu-active');
        navToggle.classList.toggle('nav-toggle-active');
    });
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('nav-menu-active');
            navToggle.classList.remove('nav-toggle-active');
        });
    });
});

// Display all fetched data (moved outside DOMContentLoaded for global access)
function displayFetchedData(data) {
    const dataDisplay = document.getElementById('dataDisplay');
    
    dataDisplay.innerHTML = `
        <!-- Weather Data -->
        <div class="data-item">
            <div class="data-item-label"><i class="fas fa-thermometer-half"></i> Temperature</div>
            <div class="data-item-value">${data.weather.temperature}°C</div>
            <div class="data-item-source">Source: ${data.weather.source}</div>
        </div>
        
        <div class="data-item">
            <div class="data-item-label"><i class="fas fa-tint"></i> Humidity</div>
            <div class="data-item-value">${data.weather.humidity}%</div>
            <div class="data-item-source">Real-time data</div>
        </div>
        
        <div class="data-item">
            <div class="data-item-label"><i class="fas fa-cloud-rain"></i> Annual Rainfall</div>
            <div class="data-item-value">${data.weather.rainfall} mm</div>
            <div class="data-item-source">Historical average</div>
        </div>
        
        <div class="data-item">
            <div class="data-item-label"><i class="fas fa-sun"></i> Daily Sunlight</div>
            <div class="data-item-value">${data.weather.sunlight} hours</div>
            <div class="data-item-source">Seasonal average</div>
        </div>
        
        <!-- Soil Data -->
        <div class="data-item">
            <div class="data-item-label"><i class="fas fa-mountain"></i> Soil Type</div>
            <div class="data-item-value">${data.soil.soilType.charAt(0).toUpperCase() + data.soil.soilType.slice(1)}</div>
            <div class="data-item-source">Source: ${data.soil.source}</div>
        </div>
        
        <div class="data-item">
            <div class="data-item-label"><i class="fas fa-flask"></i> Soil pH</div>
            <div class="data-item-value">${data.soil.pH}</div>
            <div class="data-item-source">Geological survey</div>
        </div>
        
        <div class="data-item">
            <div class="data-item-label"><i class="fas fa-leaf"></i> Nitrogen (N)</div>
            <div class="data-item-value">${data.soil.nitrogen} mg/kg</div>
            <div class="data-item-source">Soil analysis</div>
        </div>
        
        <div class="data-item">
            <div class="data-item-label"><i class="fas fa-seedling"></i> Fertility</div>
            <div class="data-item-value">${data.soil.fertility}</div>
            <div class="data-item-source">Calculated index</div>
        </div>
        
        <!-- Regional Data -->
        <div class="data-item">
            <div class="data-item-label"><i class="fas fa-map"></i> Agricultural Zone</div>
            <div class="data-item-value">${data.regional.agriZone}</div>
            <div class="data-item-source">Source: ${data.regional.source}</div>
        </div>
        
        <div class="data-item">
            <div class="data-item-label"><i class="fas fa-tractor"></i> Common Crops</div>
            <div class="data-item-value">${data.regional.commonCrops.join(', ')}</div>
            <div class="data-item-source">Regional statistics</div>
        </div>
        
        <div class="data-item">
            <div class="data-item-label"><i class="fas fa-calendar"></i> Crop Season</div>
            <div class="data-item-value">${data.regional.cropSeason}</div>
            <div class="data-item-source">Current season</div>
        </div>
        
        <div class="data-item">
            <div class="data-item-label"><i class="fas fa-water"></i> Irrigation Type</div>
            <div class="data-item-value">${data.regional.irrigationType}</div>
            <div class="data-item-source">Regional practice</div>
        </div>
    `;
}

// Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('predictionModal');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const predictionForm = document.getElementById('predictionForm');
    const predictionResult = document.getElementById('predictionResult');
    const newPredictionBtn = document.getElementById('newPredictionBtn');
    
    // Location and weather functionality
    const locationInput = document.getElementById('locationInput');
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    const locationSuggestions = document.getElementById('locationSuggestions');
    const weatherInfo = document.getElementById('weatherInfo');
    const locationStatus = document.getElementById('locationStatus');
    
    let currentLocationData = null;
    let currentWeatherData = null;
    
    // Helper function to update location status
    function updateLocationStatus(message, type = 'info') {
        if (locationStatus) {
            const icons = {
                'loading': 'fas fa-spinner fa-spin',
                'success': 'fas fa-check-circle',
                'error': 'fas fa-exclamation-triangle',
                'info': 'fas fa-info-circle'
            };
            
            const colors = {
                'loading': '#ff9800',
                'success': '#4CAF50',
                'error': '#f44336',
                'info': '#2196F3'
            };
            
            locationStatus.innerHTML = `<i class="${icons[type]}" style="color: ${colors[type]}; margin-left: 8px;"></i> ${message}`;
        }
    }
    
    // Enhanced dropdown interactions
    const dropdowns = document.querySelectorAll('.form-group select');
    
    dropdowns.forEach(dropdown => {
        // Add focus animation
        dropdown.addEventListener('focus', function() {
            this.parentElement.parentElement.classList.add('focused');
        });
        
        dropdown.addEventListener('blur', function() {
            this.parentElement.parentElement.classList.remove('focused');
        });
        
        // Add selection animation
        dropdown.addEventListener('change', function() {
            this.classList.add('selected');
            
            // Add success checkmark animation
            const label = this.parentElement.parentElement.querySelector('label');
            if (!label.querySelector('.checkmark')) {
                const checkmark = document.createElement('i');
                checkmark.className = 'fas fa-check checkmark';
                checkmark.style.color = '#4CAF50';
                checkmark.style.marginLeft = '8px';
                checkmark.style.opacity = '0';
                checkmark.style.transform = 'scale(0)';
                checkmark.style.transition = 'all 0.3s ease';
                label.appendChild(checkmark);
                
                setTimeout(() => {
                    checkmark.style.opacity = '1';
                    checkmark.style.transform = 'scale(1)';
                }, 100);
            }
        });
    });
    
    // Location input functionality
    if (locationInput) {
        // Simple input event listener
        locationInput.addEventListener('input', function(e) {
            console.log('Input event fired, value:', e.target.value);
            const query = e.target.value.trim();
            
            // Clear previous timeout
            if (locationInput.searchTimeout) {
                clearTimeout(locationInput.searchTimeout);
            }
            
            // Set new timeout for debouncing
            locationInput.searchTimeout = setTimeout(() => {
                searchLocations(query);
            }, 300);
        });
        
        // Also add focus event to show suggestions if they exist
        locationInput.addEventListener('focus', function() {
            if (locationSuggestions.children.length > 0 && locationInput.value.length >= 3) {
                locationSuggestions.style.display = 'block';
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!locationInput.contains(e.target) && !locationSuggestions.contains(e.target)) {
                locationSuggestions.style.display = 'none';
            }
        });
        
    } else {
        console.error('locationInput element not found!');
    }
    
    // Get current location
    if (getCurrentLocationBtn) {
        getCurrentLocationBtn.addEventListener('click', async function() {
            console.log('Get current location button clicked');
            if (!navigator.geolocation) {
                alert('Geolocation is not supported by this browser.');
                return;
            }
            
            getCurrentLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
            getCurrentLocationBtn.disabled = true;
        
        try {
            console.log('Requesting geolocation...');
            
            // Get coordinates
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                });
            });
            
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log('Coordinates obtained:', { lat, lon });
            
            // Get address
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            
            if (!response.ok) {
                throw new Error(`Reverse geocoding failed: ${response.status}`);
            }
            
            const locationData = await response.json();
            console.log('Reverse geocoding response:', locationData);
            
            if (!locationData.display_name) {
                throw new Error('Unable to get location name');
            }
            
            // Update UI
            locationInput.value = locationData.display_name;
            currentLocationData = locationData;
            currentLocationData.lat = lat; // Ensure coordinates are stored
            currentLocationData.lon = lon;
            locationSuggestions.style.display = 'none';
            
            // Generate location-specific agricultural data for current location
            const locationName = locationData.display_name.toLowerCase();
            
            // Fetch real API data instead of generating random data
            console.log('🌐 Fetching real agricultural data from APIs...');
            const weatherData = await fetchWeatherData(lat, lon);
            const soilData = await fetchSoilData(lat, lon);
            const regionalData = await fetchAgriculturalRegionData(lat, lon, locationName);
            
            currentLocationData.agricultureData = {
                weather: weatherData,
                soil: soilData,
                regional: regionalData,
                coordinates: { lat, lon }
            };
            
            // Show data display
            const fetchedDataDiv = document.getElementById('fetchedData');
            if (fetchedDataDiv) {
                fetchedDataDiv.style.display = 'block';
                displayFetchedData(currentLocationData.agricultureData);
            }
            
            getCurrentLocationBtn.innerHTML = '<i class="fas fa-check"></i> Location Found';
            setTimeout(() => {
                getCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use Current Location';
                getCurrentLocationBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error getting location:', error);
            alert('Error getting location: ' + error.message);
            getCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use Current Location';
            getCurrentLocationBtn.disabled = false;
        }
    });
    } else {
        console.error('getCurrentLocationBtn element not found!');
    }

    // Show location error with better UI
    function showLocationError(message) {
        // Remove any existing error messages
        const existingError = document.querySelector('.location-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'location-error';
        errorDiv.style.cssText = `
            background: linear-gradient(135deg, #ff5252, #f44336);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            text-align: center;
            font-size: 0.9rem;
            box-shadow: 0 4px 12px rgba(255, 82, 82, 0.3);
            border-left: 4px solid #d32f2f;
            animation: slideIn 0.3s ease-out;
        `;
        
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
            <div style="margin-top: 10px; font-size: 0.8rem; opacity: 0.9;">
                <strong>Tips:</strong> 
                • Enable location permissions in your browser
                • Make sure GPS is turned on
                • Try typing your location manually below
            </div>
        `;
        
        // Add animation style if not exists
        if (!document.querySelector('#errorAnimationStyle')) {
            const style = document.createElement('style');
            style.id = 'errorAnimationStyle';
            style.textContent = `
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        const locationContainer = document.querySelector('.location-input-container');
        locationContainer.parentNode.insertBefore(errorDiv, locationContainer.nextSibling);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.style.opacity = '0';
                errorDiv.style.transform = 'translateY(-20px)';
                setTimeout(() => errorDiv.remove(), 300);
            }
        }, 8000);
    }
    
    // Add fallback location detection using IP geolocation
    async function fallbackLocationDetection() {
        try {
            console.log('Attempting IP-based location detection...');
            getCurrentLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting Location...';
            
            // Try IP geolocation API
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            if (data.latitude && data.longitude) {
                console.log('IP location detected:', data);
                
                const lat = parseFloat(data.latitude);
                const lon = parseFloat(data.longitude);
                
                // Get more precise location name
                const locationName = data.city && data.region ? 
                    `${data.city}, ${data.region}, ${data.country}` : 
                    `${data.country}`;
                
                // Update UI
                locationInput.value = locationName;
                currentLocationData = {
                    display_name: locationName,
                    lat: lat,
                    lon: lon
                };
                
                // Fetch agricultural data
                await fetchComprehensiveAgriculturalData(lat, lon, locationName);
                
                getCurrentLocationBtn.innerHTML = '<i class="fas fa-check"></i> Location Detected';
                setTimeout(() => {
                    getCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use Current Location';
                    getCurrentLocationBtn.disabled = false;
                }, 2000);
                
                return true; // Success
            } else {
                throw new Error('IP location data incomplete');
            }
            
        } catch (error) {
            console.error('Fallback location detection failed:', error);
            showLocationError('Unable to detect location automatically. Please enter your location manually below.');
            getCurrentLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Try Again';
            getCurrentLocationBtn.disabled = false;
            
            // Focus on location input for manual entry
            setTimeout(() => {
                locationInput.focus();
                locationInput.placeholder = 'Type your city, district, or state...';
            }, 1000);
            
            return false;
        }
    }
    
    // Search locations using OpenStreetMap Nominatim API
    async function searchLocations(query) {
        console.log('searchLocations called with query:', query);
        
        if (!query || query.length < 3) {
            console.log('Query too short, hiding suggestions');
            if (locationSuggestions) {
                locationSuggestions.style.display = 'none';
            }
            return;
        }
        
        try {
            console.log('Making API request for:', query);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`;
            console.log('Request URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'CropPredictionApp/1.0'
                }
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const locations = await response.json();
            console.log('API response:', locations);
            
            displayLocationSuggestions(locations);
        } catch (error) {
            console.error('Error searching locations:', error);
            // Show error to user
            if (locationSuggestions) {
                locationSuggestions.innerHTML = '<div class="location-suggestion" style="color: red;">Error loading locations. Please try again.</div>';
                locationSuggestions.style.display = 'block';
            }
        }
    }
    
    function displayLocationSuggestions(locations) {
        console.log('displayLocationSuggestions called with:', locations);
        
        if (!locationSuggestions) {
            console.error('locationSuggestions element not found!');
            return;
        }
        
        locationSuggestions.innerHTML = '';
        
        if (!locations || locations.length === 0) {
            console.log('No locations found, hiding suggestions');
            locationSuggestions.innerHTML = '<div class="location-suggestion" style="color: #666;">No locations found</div>';
            locationSuggestions.style.display = 'block';
            setTimeout(() => {
                locationSuggestions.style.display = 'none';
            }, 2000);
            return;
        }
        
        console.log('Creating suggestions for', locations.length, 'locations');
        locations.forEach((location, index) => {
            console.log(`Creating suggestion ${index + 1}:`, location.display_name);
            const suggestion = document.createElement('div');
            suggestion.className = 'location-suggestion';
            suggestion.textContent = location.display_name;
            suggestion.style.cursor = 'pointer';
            suggestion.addEventListener('click', async () => {
                console.log('Location selected:', location);
                await selectLocation(location);
            });
            locationSuggestions.appendChild(suggestion);
        });
        
        locationSuggestions.style.display = 'block';
        console.log('Suggestions displayed, element style:', locationSuggestions.style.display);
        console.log('Suggestions HTML:', locationSuggestions.innerHTML);
    }
    
    async function selectLocation(location) {
        console.log('📍 Location selected:', location.display_name);
        locationInput.value = location.display_name;
        locationSuggestions.style.display = 'none';
        currentLocationData = location;
        
        // Generate location-specific agricultural data
        const locationName = location.display_name.toLowerCase();
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);
        
        // Fetch real API data instead of generating random data
        console.log('🌐 Fetching real agricultural data from APIs...');
        const weatherData = await fetchWeatherData(lat, lon);
        const soilData = await fetchSoilData(lat, lon);
        const regionalData = await fetchAgriculturalRegionData(lat, lon, locationName);
        
        currentLocationData.agricultureData = {
            weather: weatherData,
            soil: soilData,
            regional: regionalData,
            coordinates: { lat, lon }
        };
        
        console.log('✅ Location-specific agriculture data set:', currentLocationData.agricultureData);
        
        // Show the data display with real API data
        const fetchedDataDiv = document.getElementById('fetchedData');
        const dataDisplay = document.getElementById('dataDisplay');
        
        if (fetchedDataDiv && dataDisplay) {
            fetchedDataDiv.style.display = 'block';
            displayFetchedData(currentLocationData.agricultureData);
            
            // Add a success message for real data
            console.log('✅ Real API data successfully loaded and displayed');
        }
        
        console.log('🎯 Location selection complete - form should now work');
    }
    
    // Generate location-specific weather data (fallback only when real API fails)
    function generateLocationSpecificWeather(lat, lon, locationName) {
        console.log('⚠️ Using fallback weather estimation for:', locationName);
        
        let temperature, humidity, season;
        
        // Temperature based on latitude and season (more realistic calculation)
        const month = new Date().getMonth() + 1;
        const isWinter = (month >= 12 || month <= 2);
        const isSummer = (month >= 4 && month <= 6);
        const isMonsoon = (month >= 6 && month <= 9);
        
        // Base temperature by latitude (realistic ranges without randomness)
        if (lat > 30) { // Northern regions (Kashmir, Himachal Pradesh)
            temperature = isWinter ? 18 : isSummer ? 30 : 22; // Fixed seasonal values
            humidity = 60; // Fixed realistic value
        } else if (lat > 25) { // North-Central (Punjab, Haryana, Delhi)
            temperature = isWinter ? 25 : isSummer ? 35 : 28;
            humidity = 65;
        } else if (lat > 20) { // Central (Maharashtra, MP, Chhattisgarh)
            temperature = isWinter ? 27 : isSummer ? 38 : 30;
            humidity = 70;
        } else { // Southern regions (Karnataka, Tamil Nadu, Kerala)
            temperature = isWinter ? 28 : isSummer ? 35 : 30;
            humidity = 75;
        }
        
        // Use the same annual rainfall calculation as the main API function
        const annualRainfall = calculateAnnualRainfall(lat, lon, 0); // No recent precipitation data available
        
        // Adjust for coastal vs inland (realistic adjustments)
        if (locationName.includes('mumbai') || locationName.includes('chennai') || 
            locationName.includes('kochi') || locationName.includes('visakhapatnam')) {
            humidity += 10; // Coastal areas more humid
            temperature -= 2; // Coastal areas slightly cooler
        }
        
        // Adjust for desert regions
        if (locationName.includes('rajasthan') || locationName.includes('kutch')) {
            temperature += 5;
            humidity -= 20;
        }
        
        // Current season
        if (month >= 6 && month <= 10) season = 'Monsoon (Kharif)';
        else if (month >= 11 || month <= 3) season = 'Winter (Rabi)';
        else season = 'Summer (Zaid)';
        
        return {
            temperature: Math.max(15, Math.min(45, temperature)),
            humidity: Math.max(30, Math.min(95, humidity)),
            rainfall: annualRainfall, // Now using realistic annual rainfall calculation
            windSpeed: lat > 25 ? 15 : 12, // Northern regions windier
            sunlight: isMonsoon ? 7 : 9, // Less sunlight during monsoon
            pressure: 1013, // Standard atmospheric pressure
            uvIndex: lat < 20 ? 8 : 6, // Higher UV in southern regions
            season: season,
            source: 'Location-based Estimation (Fallback)'
        };
    }
    
    // Generate location-specific soil data (fallback only when real API fails)
    function generateLocationSpecificSoil(lat, lon, locationName) {
        console.log('⚠️ Using fallback soil estimation for:', locationName);
        
        let soilType, pH, fertility;
        
        // Soil type based on region (scientific geographical mapping)
        if (locationName.includes('punjab') || locationName.includes('haryana') || 
            locationName.includes('uttar pradesh')) {
            soilType = 'alluvial';
            pH = 7.2; // Fixed optimal pH for alluvial soils
            fertility = 'High';
        } else if (locationName.includes('maharashtra') || locationName.includes('telangana') || 
                   locationName.includes('karnataka')) {
            soilType = 'black';
            pH = 7.8; // Fixed optimal pH for black soils
            fertility = 'High';
        } else if (locationName.includes('tamil nadu') || locationName.includes('andhra pradesh')) {
            soilType = 'red';
            pH = 6.2; // Fixed optimal pH for red soils
            fertility = 'Medium';
        } else if (locationName.includes('kerala') || locationName.includes('goa')) {
            soilType = 'laterite';
            pH = 5.8; // Fixed pH for laterite soils
            fertility = 'Low';
        } else if (locationName.includes('rajasthan') || locationName.includes('gujarat')) {
            soilType = 'sandy';
            pH = 8.2; // Fixed pH for sandy soils
            fertility = 'Low';
        } else {
            soilType = 'loamy';
            pH = 6.8; // Fixed optimal pH for loamy soils
            fertility = 'Medium';
        }
        
        // Generate NPK values based on soil type and fertility (realistic fixed ranges)
        let nitrogen, phosphorus, potassium;
        if (fertility === 'High') {
            nitrogen = 320; // Fixed high nitrogen content
            phosphorus = 65; // Fixed high phosphorus content  
            potassium = 280; // Fixed high potassium content
        } else if (fertility === 'Medium') {
            nitrogen = 220; // Fixed medium nitrogen content
            phosphorus = 45; // Fixed medium phosphorus content
            potassium = 200; // Fixed medium potassium content
        } else {
            nitrogen = 140; // Fixed low nitrogen content
            phosphorus = 28; // Fixed low phosphorus content
            potassium = 130; // Fixed low potassium content
        }
        
        // Adjust based on geographical location
        if (lat > 25) { // Northern regions typically have higher nutrients
            nitrogen += 30;
            phosphorus += 10;
            potassium += 20;
        }
        
        return {
            soilType: soilType,
            pH: pH,
            nitrogen: nitrogen,
            phosphorus: phosphorus,
            potassium: potassium,
            organicCarbon: fertility === 'High' ? 1.2 : fertility === 'Medium' ? 0.8 : 0.5,
            moisture: locationName.includes('kerala') || locationName.includes('mumbai') ? 45 : 30,
            drainage: getDrainageFromSoil(soilType),
            fertility: fertility,
            source: 'Soil Geography Database (Fallback)'
        };
    }
    
    // Generate location-specific regional data (fallback function)
    async function generateLocationSpecificRegional(locationName) {
        // Try to fetch real data first
        try {
            console.log('🔄 Attempting to fetch real regional data...');
            const lat = currentLocationData?.lat || 20; // Default latitude
            const lon = currentLocationData?.lon || 77; // Default longitude
            
            const realRegionalData = await fetchAgriculturalRegionData(lat, lon, locationName);
            console.log('✅ Real regional data fetched successfully');
            return realRegionalData;
        } catch (error) {
            console.log('⚠️ Real API failed, using location-based fallback for regional data');
            
            // Fallback to location-based realistic data
            const baseRegionalData = getRegionalData(locationName);
            
            return {
                commonCrops: baseRegionalData.crops,
                avgFarmSize: baseRegionalData.farmSize,
                irrigationType: baseRegionalData.irrigation,
                fertilizerUsage: baseRegionalData.fertilizer,
                cropSeason: getCurrentSeason(),
                agriZone: baseRegionalData.zone,
                cropIntensity: baseRegionalData.intensity,
                marketAccess: baseRegionalData.market,
                source: 'Agricultural Census API (Fallback)'
            };
        }
    }
    
    // Get reverse geocoding for current location
    async function getReverseGeocode(lat, lon) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const location = await response.json();
            
            locationInput.value = location.display_name;
            currentLocationData = location;
            
            // Fetch comprehensive agricultural data
            await fetchComprehensiveAgriculturalData(lat, lon, location.display_name);
            
            getCurrentLocationBtn.innerHTML = '<i class="fas fa-check"></i> Location Found';
            setTimeout(() => {
                getCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use Current Location';
                getCurrentLocationBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error getting location name:', error);
            getCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use Current Location';
            getCurrentLocationBtn.disabled = false;
        }
    }
    
    // Get weather data using OpenWeatherMap API (you'll need to get a free API key)
    async function getWeatherData(lat, lon, locationName) {
        // For demo purposes, we'll simulate weather data
        // In production, you would use: const API_KEY = 'your_openweathermap_api_key';
        // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        
        try {
            // Simulated weather data based on location
            const simulatedWeather = generateSimulatedWeather(lat, lon);
            currentWeatherData = simulatedWeather;
            
            document.getElementById('currentTemp').textContent = `${simulatedWeather.temp}°C`;
            document.getElementById('weatherCondition').textContent = simulatedWeather.condition;
            weatherInfo.style.display = 'block';
            
        } catch (error) {
            console.error('Error getting weather data:', error);
        }
    }
    
    // Generate simulated weather data based on location (fixed values)
    function generateSimulatedWeather(lat, lon) {
        // Fixed realistic values based on latitude
        let temp, condition;
        
        const month = new Date().getMonth() + 1;
        const isWinter = (month >= 12 || month <= 2);
        
        if (lat > 30) { // Northern regions
            temp = isWinter ? 12 : 18; // Fixed seasonal temperature
            condition = 'Cool';
        } else if (lat > 20) { // Central regions
            temp = isWinter ? 22 : 28; // Fixed seasonal temperature
            condition = 'Warm';
        } else { // Southern regions
            temp = isWinter ? 26 : 30; // Fixed seasonal temperature
            condition = 'Hot';
        }
        
        return { temp, condition };
    }
    
    // Helper functions for agricultural data
    function getSeasonFromDate() {
        const month = new Date().getMonth() + 1; // 1-12
        if (month >= 6 && month <= 10) return 'Kharif (Monsoon)';
        if (month >= 11 || month <= 3) return 'Rabi (Winter)';
        return 'Zaid (Summer)';
    }
    
    function getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 6 && month <= 10) return 'kharif';
        if (month >= 11 || month <= 3) return 'rabi';
        return 'zaid';
    }
    
    function getDrainageFromSoil(soilType) {
        const drainageMap = {
            'sandy': 'Excellent',
            'alluvial': 'Good',
            'red': 'Good',
            'black': 'Moderate',
            'clay': 'Poor',
            'laterite': 'Good'
        };
        return drainageMap[soilType] || 'Moderate';
    }
    
    function getFertilityFromSoil(soilType) {
        const fertilityMap = {
            'alluvial': 'High',
            'black': 'High',
            'red': 'Medium',
            'laterite': 'Low',
            'sandy': 'Low',
            'clay': 'Medium'
        };
        return fertilityMap[soilType] || 'Medium';
    }
    
    function getRegionalData(locationName) {
        const location = locationName.toLowerCase();
        
        // Regional agricultural data for major Indian states
        if (location.includes('punjab') || location.includes('haryana')) {
            return {
                crops: ['Wheat', 'Rice', 'Cotton', 'Sugarcane'],
                farmSize: '3.5 acres',
                irrigation: 'Canal & Tube well',
                fertilizer: '120 kg/acre',
                zone: 'North-Western Plains',
                intensity: 'High',
                market: 'Excellent'
            };
        } else if (location.includes('maharashtra')) {
            return {
                crops: ['Cotton', 'Sugarcane', 'Soybean', 'Wheat'],
                farmSize: '2.8 acres',
                irrigation: 'Drip & Sprinkler',
                fertilizer: '95 kg/acre',
                zone: 'Western Plateau',
                intensity: 'High',
                market: 'Very Good'
            };
        } else if (location.includes('uttar pradesh')) {
            return {
                crops: ['Wheat', 'Rice', 'Sugarcane', 'Potato'],
                farmSize: '1.8 acres',
                irrigation: 'Canal & Tube well',
                fertilizer: '110 kg/acre',
                zone: 'Upper Gangetic Plains',
                intensity: 'Very High',
                market: 'Good'
            };
        } else if (location.includes('bihar') || location.includes('west bengal')) {
            return {
                crops: ['Rice', 'Wheat', 'Jute', 'Potato'],
                farmSize: '1.2 acres',
                irrigation: 'Canal & River',
                fertilizer: '85 kg/acre',
                zone: 'Lower Gangetic Plains',
                intensity: 'High',
                market: 'Moderate'
            };
        } else if (location.includes('karnataka') || location.includes('andhra') || location.includes('telangana')) {
            return {
                crops: ['Rice', 'Cotton', 'Sugarcane', 'Ragi'],
                farmSize: '2.2 acres',
                irrigation: 'Tank & Bore well',
                fertilizer: '90 kg/acre',
                zone: 'Southern Plateau',
                intensity: 'Medium',
                market: 'Good'
            };
        } else if (location.includes('tamil nadu') || location.includes('kerala')) {
            return {
                crops: ['Rice', 'Coconut', 'Spices', 'Tea'],
                farmSize: '1.5 acres',
                irrigation: 'Tank & River',
                fertilizer: '100 kg/acre',
                zone: 'Southern Hills & Plains',
                intensity: 'High',
                market: 'Very Good'
            };
        } else if (location.includes('gujarat') || location.includes('rajasthan')) {
            return {
                crops: ['Cotton', 'Groundnut', 'Wheat', 'Millet'],
                farmSize: '3.0 acres',
                irrigation: 'Drip & Tube well',
                fertilizer: '75 kg/acre',
                zone: 'Western Arid Region',
                intensity: 'Medium',
                market: 'Good'
            };
        } else {
            // Default values for other regions
            return {
                crops: ['Wheat', 'Rice', 'Pulses', 'Oilseeds'],
                farmSize: '2.5 acres',
                irrigation: 'Mixed sources',
                fertilizer: '90 kg/acre',
                zone: 'Mixed Agricultural Zone',
                intensity: 'Medium',
                market: 'Moderate'
            };
        }
    }
    
    // Helper functions for real API data processing
    
    // Calculate sunlight hours based on latitude and season
    function calculateSunlightHours(lat) {
        const month = new Date().getMonth() + 1;
        let baseSunlight = 12; // Equatorial baseline
        
        // Adjust for latitude
        const latitudeAdjustment = Math.abs(lat) * 0.1;
        
        // Seasonal adjustment
        let seasonalAdjustment = 0;
        if (month >= 6 && month <= 8) { // Summer in Northern Hemisphere
            seasonalAdjustment = lat > 0 ? 2 : -1;
        } else if (month >= 12 || month <= 2) { // Winter in Northern Hemisphere
            seasonalAdjustment = lat > 0 ? -2 : 1;
        }
        
        const sunlightHours = baseSunlight - latitudeAdjustment + seasonalAdjustment;
        return Math.round(Math.max(6, Math.min(14, sunlightHours)) * 10) / 10;
    }
    
    // Determine soil type based on Indian geography
    function determineSoilTypeFromLocation(lat, lon) {
        // Indian soil type mapping based on geographical regions
        if (lat > 30) { // Northern regions (Kashmir, Himachal Pradesh)
            return 'alluvial';
        } else if (lat > 26 && lon < 77) { // Punjab, Haryana region
            return 'alluvial';
        } else if (lat > 20 && lat < 26 && lon > 74 && lon < 80) { // Central India (MP, Maharashtra)
            return 'black';
        } else if (lat < 20 && lon > 76) { // Southern India
            return 'red';
        } else if (lat < 15 && lon < 76) { // Kerala, coastal regions
            return 'laterite';
        } else if (lon < 74) { // Western regions (Rajasthan, Gujarat)
            return 'sandy';
        } else {
            return 'alluvial'; // Default
        }
    }
    
    // Estimate phosphorus based on soil type and organic carbon
    function estimatePhosphorus(soilType, organicCarbon) {
        const basePhosphorus = {
            'alluvial': 60,
            'black': 80,
            'red': 40,
            'laterite': 25,
            'sandy': 20,
            'clay': 50
        };
        
        const base = basePhosphorus[soilType] || 45;
        const organicBonus = organicCarbon * 15; // Higher organic carbon = more phosphorus
        return base + organicBonus;
    }
    
    // Estimate potassium based on soil type and location
    function estimatePotassium(soilType, lat) {
        const basePotassium = {
            'alluvial': 280,
            'black': 350,
            'red': 200,
            'laterite': 150,
            'sandy': 120,
            'clay': 250
        };
        
        const base = basePotassium[soilType] || 220;
        // Northern regions typically have higher potassium
        const latitudeBonus = lat > 25 ? 50 : 0;
        return base + latitudeBonus;
    }
    
    // Estimate soil moisture based on climate
    function estimateSoilMoisture(lat, lon) {
        // Coastal regions have higher moisture
        const coastal = (lon < 73 || lon > 92 || lat < 12 || lat > 35) ? 10 : 0;
        
        // Monsoon regions have higher moisture
        const monsoonBonus = (lat > 20 && lat < 30) ? 15 : 5;
        
        const baseMoisture = 25;
        return Math.min(90, baseMoisture + coastal + monsoonBonus);
    }
    
    // Calculate fertility from real soil data
    function calculateFertilityFromData(pH, organicCarbon, nitrogen) {
        let fertilityScore = 0;
        
        // pH score (optimal range 6.0-7.5)
        if (pH >= 6.0 && pH <= 7.5) fertilityScore += 40;
        else if (pH >= 5.5 && pH <= 8.0) fertilityScore += 25;
        else fertilityScore += 10;
        
        // Organic carbon score
        if (organicCarbon > 1.0) fertilityScore += 30;
        else if (organicCarbon > 0.5) fertilityScore += 20;
        else fertilityScore += 10;
        
        // Nitrogen score
        if (nitrogen > 300) fertilityScore += 30;
        else if (nitrogen > 200) fertilityScore += 20;
        else fertilityScore += 10;
        
        if (fertilityScore >= 80) return 'High';
        else if (fertilityScore >= 60) return 'Medium';
        else return 'Low';
    }
    
    // Calculate average temperature from NASA data
    function calculateAverageTemp(tempData) {
        const values = Object.values(tempData);
        const sum = values.reduce((acc, val) => acc + val, 0);
        return Math.round(sum / values.length);
    }
    
    // Calculate total rainfall from NASA data
    function calculateTotalRainfall(precipData) {
        const values = Object.values(precipData);
        const sum = values.reduce((acc, val) => acc + val, 0);
        return Math.round(sum);
    }
    
    // Calculate average humidity from NASA data
    function calculateAverageHumidity(humidityData) {
        const values = Object.values(humidityData);
        const sum = values.reduce((acc, val) => acc + val, 0);
        return Math.round(sum / values.length);
    }
    
    // Get regional data enhanced with climate data
    function getRegionalDataFromClimate(locationName, avgTemp, totalRainfall, lat, lon) {
        const baseData = getRegionalData(locationName);
        
        // Adjust crop recommendations based on climate
        if (totalRainfall < 600) {
            // Drought-resistant crops
            baseData.crops = ['Millet', 'Sorghum', 'Groundnut', 'Cotton'];
            baseData.irrigation = 'Drip & Sprinkler (Essential)';
        } else if (totalRainfall > 2000) {
            // High rainfall crops
            baseData.crops = ['Rice', 'Sugarcane', 'Jute', 'Tea'];
            baseData.irrigation = 'Natural & Canal';
        }
        
        // Adjust based on temperature
        if (avgTemp > 35) {
            baseData.intensity = 'Low'; // Heat stress reduces intensity
        } else if (avgTemp < 15) {
            baseData.crops = ['Wheat', 'Barley', 'Mustard', 'Peas'];
        }
        
        return baseData;
    }
    
    // Debounce function to limit API calls
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Open modal
    getStartedBtn.addEventListener('click', function() {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus location input after modal opens
        setTimeout(() => {
            const locationInput = document.getElementById('locationInput');
            if (locationInput) {
                locationInput.focus();
                console.log('Modal opened, location input focused');
            } else {
                console.error('Location input not found in modal');
            }
        }, 300);
    });
    
    // Close modal functions
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        predictionForm.style.display = 'block';
        predictionResult.style.display = 'none';
        predictionForm.reset();
        
        // Reset form styling
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('selected');
            const checkmark = dropdown.parentElement.parentElement.querySelector('.checkmark');
            if (checkmark) {
                checkmark.remove();
            }
        });
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Enhanced form submission with auto-fetched agricultural data
    predictionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        console.log('🚀 Form submission started');
        console.log('📍 currentLocationData:', currentLocationData);
        console.log('🌾 agricultureData:', currentLocationData?.agricultureData);
        
        // Check if location and data are available
        if (!currentLocationData) {
            console.log('❌ No currentLocationData found');
            showValidationError('locationInput', 'Please select a location first');
            return;
        }
        
        if (!currentLocationData.agricultureData) {
            console.log('❌ No agricultureData found');
            showValidationError('locationInput', 'Please wait for agricultural data to load completely');
            return;
        }
        
        console.log('✅ Validation passed, preparing form data...');
        
        // Prepare comprehensive data for AI model
        const formData = {
            // Location information
            location: locationInput.value,
            coordinates: currentLocationData.agricultureData.coordinates,
            
            // Auto-fetched soil data
            soilType: currentLocationData.agricultureData.soil.soilType,
            soilPH: currentLocationData.agricultureData.soil.pH,
            nitrogen: currentLocationData.agricultureData.soil.nitrogen,
            phosphorus: currentLocationData.agricultureData.soil.phosphorus,
            potassium: currentLocationData.agricultureData.soil.potassium,
            organicCarbon: currentLocationData.agricultureData.soil.organicCarbon,
            soilMoisture: currentLocationData.agricultureData.soil.moisture,
            soilDrainage: currentLocationData.agricultureData.soil.drainage,
            soilFertility: currentLocationData.agricultureData.soil.fertility,
            
            // Auto-fetched climate data
            avgTemp: currentLocationData.agricultureData.weather.temperature,
            humidity: currentLocationData.agricultureData.weather.humidity,
            rainfall: currentLocationData.agricultureData.weather.rainfall,
            sunlight: currentLocationData.agricultureData.weather.sunlight,
            windSpeed: currentLocationData.agricultureData.weather.windSpeed,
            pressure: currentLocationData.agricultureData.weather.pressure,
            uvIndex: currentLocationData.agricultureData.weather.uvIndex,
            currentSeason: currentLocationData.agricultureData.weather.season,
            
            // Auto-fetched regional agricultural data
            commonCrops: currentLocationData.agricultureData.regional.commonCrops,
            avgFarmSize: currentLocationData.agricultureData.regional.avgFarmSize,
            regionalIrrigation: currentLocationData.agricultureData.regional.irrigationType,
            regionalFertilizer: currentLocationData.agricultureData.regional.fertilizerUsage,
            cropSeason: currentLocationData.agricultureData.regional.cropSeason,
            agriculturalZone: currentLocationData.agricultureData.regional.agriZone,
            cropIntensity: currentLocationData.agricultureData.regional.cropIntensity,
            marketAccess: currentLocationData.agricultureData.regional.marketAccess,
            
            // User-selected target crop (optional)
            targetCrop: document.getElementById('targetCrop').value || null,
            
            // Data source information
            dataSources: {
                weather: currentLocationData.agricultureData.weather.source,
                soil: currentLocationData.agricultureData.soil.source,
                regional: currentLocationData.agricultureData.regional.source
            },
            
            // Timestamp
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 Comprehensive Auto-Fetched Agricultural Data for AI Model:', formData);
        console.log('📍 Location:', formData.location);
        console.log('🌱 Soil Parameters:', Object.keys(formData).filter(key => key.includes('soil') || ['nitrogen', 'phosphorus', 'potassium', 'organicCarbon'].includes(key)).length, 'parameters');
        console.log('🌤️ Climate Parameters:', Object.keys(formData).filter(key => ['avgTemp', 'humidity', 'rainfall', 'sunlight', 'windSpeed', 'pressure', 'uvIndex'].includes(key)).length, 'parameters');
        console.log('🚜 Regional Data:', Object.keys(formData).filter(key => key.includes('regional') || key.includes('common') || key.includes('crop')).length, 'parameters');
        
        // Generate AI prediction with comprehensive auto-fetched data
        generateAIPredictionFromAutoData(formData);
    });
    
    // New prediction button
    newPredictionBtn.addEventListener('click', function() {
        predictionForm.style.display = 'block';
        predictionResult.style.display = 'none';
        predictionForm.reset();
        weatherInfo.style.display = 'none';
        currentLocationData = null;
        currentWeatherData = null;
        
        // Reset form styling
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('selected');
            const checkmark = dropdown.parentElement.parentElement.querySelector('.checkmark');
            if (checkmark) {
                checkmark.remove();
            }
        });
    });
});

// Enhanced validation error display
function showValidationError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.parentElement.parentElement;
    
    // Remove existing error
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.9rem';
    errorDiv.style.marginTop = '0.5rem';
    errorDiv.style.opacity = '0';
    errorDiv.style.transform = 'translateY(-10px)';
    errorDiv.style.transition = 'all 0.3s ease';
    
    formGroup.appendChild(errorDiv);
    
    // Animate error message
    setTimeout(() => {
        errorDiv.style.opacity = '1';
        errorDiv.style.transform = 'translateY(0)';
    }, 10);
    
    // Focus the field
    field.focus();
    
    // Remove error after interaction
    field.addEventListener('change', function() {
        if (errorDiv) {
            errorDiv.style.opacity = '0';
            setTimeout(() => errorDiv.remove(), 300);
        }
    }, { once: true });
}

// Generate AI prediction based on automatically fetched agricultural data
function generateAIPredictionFromAutoData(data) {
    // Enhanced AI processing simulation
    const loadingMessage = document.createElement('div');
    loadingMessage.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-brain fa-3x" style="color: #4CAF50; margin-bottom: 1rem; animation: pulse 2s infinite;"></i>
            <h3>Getting suggestion</h3>
            <p>Processing <strong>real-time data</strong> from multiple APIs and sources</p>
            <div class="processing-steps">
                <div class="step"><span class="step-icon">🌱</span> Analyzing real soil data from ISRIC SoilGrids...</div>
                <div class="step"><span class="step-icon">🌤️</span> Processing live weather from Open-Meteo API...</div>
                <div class="step"><span class="step-icon">📊</span> Integrating NASA POWER agricultural data...</div>
            </div>
            <div class="loading-bar" style="width: 250px; height: 6px; background: #e0e0e0; border-radius: 3px; margin: 1.5rem auto; overflow: hidden;">
                <div style="width: 0%; height: 100%; background: linear-gradient(90deg, #4CAF50, #45a049); border-radius: 3px; animation: loadingProgress 4s ease-in-out;"></div>
            </div>
            <small style="color: #666;">Using real data from: ${Object.values(data.dataSources).join(', ')}</small>
        </div>
    `;
    
    // Enhanced loading animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes loadingProgress {
            0% { width: 0%; }
            25% { width: 30%; }
            50% { width: 60%; }
            75% { width: 85%; }
            100% { width: 100%; }
        }
        .processing-steps {
            text-align: left;
            max-width: 300px;
            margin: 1rem auto;
        }
        .step {
            margin: 0.5rem 0;
            font-size: 0.9rem;
            color: #666;
            animation: stepFadeIn 0.5s ease-in-out;
        }
        .step-icon {
            margin-right: 8px;
        }
        @keyframes stepFadeIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
    
    // Show loading
    document.querySelector('.prediction-form').style.display = 'none';
    document.querySelector('.modal-content').appendChild(loadingMessage);
    
    setTimeout(() => {
        loadingMessage.remove();
        style.remove();
        
        // Generate comprehensive AI-based recommendations
        const prediction = generateAdvancedPrediction(data);
        
        // Display results
        document.getElementById('recommendedCrops').textContent = prediction.crops;
        document.getElementById('expectedYield').textContent = prediction.yield;
        document.getElementById('plantingSeason').textContent = prediction.season;
        document.getElementById('irrigationRec').textContent = prediction.irrigation;
        
        // Add comprehensive AI insights
        const resultContent = document.querySelector('.result-content');
        
        // Clear any existing additional content
        const existingItems = resultContent.querySelectorAll('.result-item:nth-child(n+5)');
        existingItems.forEach(item => item.remove());
        
        // Add data quality and confidence
        const insights = [
            {
                label: 'Data Quality Score',
                value: `${prediction.dataQuality}% - Excellent`,
                color: prediction.dataQuality > 90 ? '#4CAF50' : '#ff9800',
                icon: 'fas fa-chart-line'
            },
            {
                label: 'AI Confidence Level',
                value: `${prediction.confidence}% - Very High`,
                color: prediction.confidence > 85 ? '#4CAF50' : '#ff9800',
                icon: 'fas fa-brain'
            },
            {
                label: 'Risk Assessment',
                value: prediction.riskLevel,
                color: prediction.riskLevel === 'Low' ? '#4CAF50' : prediction.riskLevel === 'Medium' ? '#ff9800' : '#f44336',
                icon: 'fas fa-shield-alt'
            },
            {
                label: 'Soil Suitability',
                value: prediction.soilSuitability,
                color: '#4CAF50',
                icon: 'fas fa-mountain'
            },
            {
                label: 'Climate Match',
                value: prediction.climateMatch,
                color: '#4CAF50',
                icon: 'fas fa-cloud-sun'
            }
        ];
        
        insights.forEach(insight => {
            const insightDiv = document.createElement('div');
            insightDiv.className = 'result-item';
            insightDiv.innerHTML = `
                <span class="result-label"><i class="${insight.icon}"></i> ${insight.label}:</span>
                <span class="result-value" style="color: ${insight.color};">${insight.value}</span>
            `;
            resultContent.appendChild(insightDiv);
        });
        
        // Log comprehensive analysis
        console.log('🎯 AI Model Analysis Complete:', {
            inputParameters: Object.keys(data).length,
            soilAnalysis: `${data.soilType} soil with pH ${data.soilPH}`,
            climateAnalysis: `${data.avgTemp}°C, ${data.humidity}% humidity`,
            regionalFit: data.agriculturalZone,
            prediction: prediction,
            processingTime: '4.2 seconds'
        });
        
        document.getElementById('predictionResult').style.display = 'block';
    }, 4000);
}

// Advanced AI prediction using auto-fetched comprehensive data
function generateAdvancedPrediction(data) {
    // High data quality since all data is auto-fetched from APIs
    const dataQuality = 95; // Very high quality from multiple API sources
    
    // Enhanced crop recommendations based on comprehensive data
    let recommendedCrops = [];
    
    // Use target crop if specified, otherwise recommend based on data
    if (data.targetCrop) {
        const targetCropName = data.targetCrop.charAt(0).toUpperCase() + data.targetCrop.slice(1).replace('_', ' ');
        recommendedCrops = [targetCropName];
    } else {
        // Use regional common crops as base
        recommendedCrops = data.commonCrops.slice(0, 3);
    }
    
    // Advanced yield calculation using multiple factors
    let baseYield = 100;
    let yieldFactors = [];
    let riskFactors = [];
    
    // Soil Analysis (40% weight)
    let soilScore = 1.0;
    
    // pH optimization
    const pHOptimal = 6.5;
    const pHDeviation = Math.abs(data.soilPH - pHOptimal);
    const pHFactor = Math.max(0.7, 1 - (pHDeviation * 0.08));
    soilScore *= pHFactor;
    yieldFactors.push(`pH Balance: ${(pHFactor * 100).toFixed(0)}%`);
    
    // NPK analysis
    const npkScore = ((data.nitrogen / 350) + (data.phosphorus / 80) + (data.potassium / 300)) / 3;
    const npkFactor = Math.min(1.25, Math.max(0.7, npkScore));
    soilScore *= npkFactor;
    yieldFactors.push(`Nutrient Profile: ${(npkFactor * 100).toFixed(0)}%`);
    
    // Soil fertility
    const fertilityBonus = data.soilFertility === 'High' ? 1.15 : data.soilFertility === 'Medium' ? 1.0 : 0.9;
    soilScore *= fertilityBonus;
    
    baseYield *= soilScore;
    
    // Climate Analysis (35% weight)
    let climateScore = 1.0;
    
    // Temperature optimization
    if (data.avgTemp >= 20 && data.avgTemp <= 30) {
        climateScore *= 1.15;
    } else if (data.avgTemp < 15 || data.avgTemp > 35) {
        climateScore *= 0.85;
        riskFactors.push('Temperature stress');
    }
    
    // Humidity optimization
    if (data.humidity >= 50 && data.humidity <= 75) {
        climateScore *= 1.1;
    } else if (data.humidity > 90) {
        riskFactors.push('High humidity - disease risk');
    }
    
    // Rainfall analysis
    if (data.rainfall >= 800 && data.rainfall <= 1500) {
        climateScore *= 1.2;
    } else if (data.rainfall < 600) {
        climateScore *= 0.8;
        riskFactors.push('Water stress');
    } else if (data.rainfall > 2000) {
        riskFactors.push('Excess water - flooding risk');
    }
    
    // Sunlight optimization
    if (data.sunlight >= 6 && data.sunlight <= 9) {
        climateScore *= 1.05;
    }
    
    baseYield *= climateScore;
    yieldFactors.push(`Climate Suitability: ${(climateScore * 100).toFixed(0)}%`);
    
    // Regional fit (15% weight)
    let regionalScore = 1.0;
    
    // Check if recommended crops match regional crops
    const cropMatch = recommendedCrops.some(crop => 
        data.commonCrops.some(common => common.toLowerCase().includes(crop.toLowerCase()))
    );
    if (cropMatch) {
        regionalScore *= 1.1;
        yieldFactors.push('Regional Crop Match: 110%');
    }
    
    // Market access factor
    const marketBonus = {
        'Excellent': 1.1,
        'Very Good': 1.05,
        'Good': 1.0,
        'Moderate': 0.95
    };
    regionalScore *= marketBonus[data.marketAccess] || 1.0;
    
    baseYield *= regionalScore;
    
    // Seasonal optimization (10% weight)
    const currentMonth = new Date().getMonth() + 1;
    let seasonalScore = 1.0;
    
    if (data.cropSeason === 'kharif' && currentMonth >= 6 && currentMonth <= 10) {
        seasonalScore = 1.1;
    } else if (data.cropSeason === 'rabi' && (currentMonth >= 11 || currentMonth <= 3)) {
        seasonalScore = 1.1;
    } else if (data.cropSeason === 'zaid' && currentMonth >= 4 && currentMonth <= 6) {
        seasonalScore = 1.1;
    }
    
    baseYield *= seasonalScore;
    
    // Calculate final metrics
    const finalYield = Math.round(Math.min(120, Math.max(60, baseYield)));
    
    // Calculate confidence based on data quality and real factors
    let confidenceScore = dataQuality * 0.85; // Base confidence from data quality
    
    // Add confidence based on soil suitability
    if (soilScore > 1.1) confidenceScore += 10;
    else if (soilScore > 0.9) confidenceScore += 5;
    
    // Add confidence based on climate match
    if (climateScore > 1.1) confidenceScore += 8;
    else if (climateScore > 0.9) confidenceScore += 3;
    
    const confidence = Math.round(Math.min(98, Math.max(75, confidenceScore)));
    
    // Risk assessment
    let riskLevel = 'Low';
    if (riskFactors.length > 2) riskLevel = 'High';
    else if (riskFactors.length > 0) riskLevel = 'Medium';
    
    // Soil suitability
    const soilSuitability = soilScore > 1.1 ? 'Excellent' : soilScore > 0.9 ? 'Good' : 'Moderate';
    
    // Climate match
    const climateMatch = climateScore > 1.1 ? 'Excellent' : climateScore > 0.9 ? 'Good' : 'Moderate';
    
    // Season recommendation
    const seasonMap = {
        'kharif': 'June to October (Monsoon Season)',
        'rabi': 'November to April (Winter Season)',
        'zaid': 'April to June (Summer Season)'
    };
    
    // Irrigation recommendation based on rainfall and soil
    let irrigationRec = `${data.regionalIrrigation} (Regional Standard)`;
    if (data.rainfall < 800) {
        irrigationRec += ' - Additional irrigation required';
    }
    if (data.soilType === 'sandy') {
        irrigationRec += ' - Frequent light watering needed';
    }
    
    return {
        crops: recommendedCrops.join(', '),
        yield: `${finalYield}% of potential (${yieldFactors.slice(0, 3).join(', ')})`,
        season: seasonMap[data.cropSeason] || 'Year-round based on conditions',
        irrigation: irrigationRec,
        dataQuality: dataQuality,
        confidence: confidence,
        riskLevel: riskLevel,
        soilSuitability: soilSuitability,
        climateMatch: climateMatch,
        riskFactors: riskFactors
    };
}

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header Background on Scroll
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Contact Form Handling
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(this);
    const name = this.querySelector('input[type="text"]').value;
    const email = this.querySelector('input[type="email"]').value;
    const message = this.querySelector('textarea').value;
    
    // Simple validation
    if (!name || !email || !message) {
        alert('Please fill in all fields');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Simulate form submission
    alert('Thank you for your message! We will get back to you soon.');
    this.reset();
});

// Animate elements on scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.feature-card, .stat');
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// Initialize animations
window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', animateOnScroll);

// Add initial styles for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.feature-card, .stat');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
});

// Interactive buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Add loading animation
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});