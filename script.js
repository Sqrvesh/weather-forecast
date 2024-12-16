async function loadWeatherData() {
  const responseObj = await fetch("https://api.open-meteo.com/v1/forecast?latitude=13.0878&longitude=80.2785&current=temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=auto&timeformat=unixtime");
  const weatherDataRaw = await responseObj.json();
  const current = weatherDataRaw.current;
  const daily = weatherDataRaw.daily;
  const hourly = weatherDataRaw.hourly;

  console.log(weatherDataRaw);

  const weatherData = {
    current: {
      time: new Date(Number(current.time)* 1000),
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      weatherCode: current.weather_code,
      isDay: current.is_day,
      windSpeed: current.wind_speed_10m
    },

    daily: {
      weatherCode: daily.weather_code,
      windSpeed: daily.wind_speed_10m_max,
      temperatureMax: daily.temperature_2m_max,
      temperatureMin: daily.temperature_2m_min,
      time: daily.time.map((t) => new Date(Number(t)* 1000)),
      precipitation: daily.precipitation_probability_max,
      uv: daily.uv_index_max.map(index => findUVIndex(index))
    },

    hourly: {
      weatherCode: hourly.weather_code,
      temperature: hourly.temperature_2m,
      time: hourly.time.map((t) => new Date(Number(t)* 1000)),
      isDay: hourly.is_day
    }
  };

  console.log(weatherData);
  return weatherData;
  
}

async function loadWeatherDescriptions() {
  const responseObj = await fetch("./data/weather-codes.json");
  const weatherDescriptions = await responseObj.json();
  return weatherDescriptions;
}

function genCurrentWeather(current, weatherDescriptions) {
  const dayNight = current.isDay ? 'day' : 'night';
  const weatherDescription = weatherDescriptions[Number(current.weatherCode)][dayNight];
  document.querySelector('.js-current-date').innerHTML = current.time.toDateString();
  document.querySelector('.js-current-temp').innerHTML = `${current.temperature}&deg;C`;
  document.querySelector('.js-current-feelslike-temp').innerHTML = `feels like ${current.apparentTemperature}&deg;C`;
  document.querySelector('.js-current-weather-description').innerHTML = weatherDescription.description;
  document.querySelector('.js-current-weather-image-div').innerHTML = `<img class="current-weather-image" src="${weatherDescription.image}">`;
  document.querySelector('.js-current-speed').innerHTML = `Wind Speed: ${current.windSpeed} kmph`;
}

function findUVIndex(index) {
    if (Number(index) < 3) {
      return 'Low'
    } else if (3 <= Number(index) && Number(index) < 6) {
      return 'Moderate'
    } else if (6 <= Number(index) && Number(index) < 8) {
      return 'High'
    } else if (8 <= Number(index) && Number(index) < 11) {
      return 'Very High'
    } else if (Number(index) && Number(index) >= 11) {
      return 'Extreme'
    }
}

function genDailyWeatherCard(dailyData, weatherDescriptions) {
  let html = '';
  days = {0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'};

  dailyData.time.forEach( (date, index) => {
    dateString = date.toDateString();
    const weatherDescription = weatherDescriptions[Number(dailyData.weatherCode[index])]['day'];
    html += `
      <div class="daily-weather-card">
        <div class="daily-date">
          <div>${dateString.slice(8,11)} ${dateString.slice(4,8)}</div>
          <div>${days[date.getDay()]}</div>
        </div>
        <div><img src=${weatherDescription.image}></div>
        <div>
          <div class="daily-temp-max">${Math.round(dailyData.temperatureMax[index])}°C</div>
          <div class="daily-temp-min">/ ${Math.round(dailyData.temperatureMin[index])}°C</div>
        </div>
        <div class="daily-info">
          <div class="daily-wind-speed">Wind Speed: <span class="daily-info-value">${Math.round(dailyData.windSpeed[index])}km/h</span></div>
          <div class="daily-precipitation">Precipitaiton: <span class="daily-info-value">${Math.round(dailyData.precipitation[index])}%</span></div>
          <div>UV: <span class="daily-info-value">${dailyData.uv[index]}</span></div>
        </div>
      </div>
    `;
  });
    
  return html;
  
}

function genHourlyweather(hourly, weatherDescriptions) {
  let html = '';
  const currentTimeHours = new Date().getHours() > 12 ? `${Number(new Date().getHours()) - 12}:00PM` : `${new Date().getHours()}:00AM`;
  const timeArray = hourly.time.map((t) => t.getHours() > 12 ? `${Number(t.getHours()) - 12}:00PM` : `${t.getHours()}:00AM`).slice(1, 32);
  const currentTimeIndex = timeArray.indexOf(currentTimeHours);
  const weatherCodeArray = hourly.weatherCode.slice(currentTimeIndex+1, currentTimeIndex+10);
  const temperatureArray = hourly.temperature.slice(currentTimeIndex+1, currentTimeIndex+10);
  const isDayArray = hourly.isDay.slice(currentTimeIndex+1, currentTimeIndex+10);
  timeArray.slice(currentTimeIndex, currentTimeIndex+9).forEach((time, index) => {
    const isDay = isDayArray[index] ? 'day' : 'night';
    const weatherDescription = weatherDescriptions[Number(weatherCodeArray[index])][isDay];
    time = (time === '0:00AM') ? '12:00AM' : time;
    html += `
      <div class="hourly-weather-card">
        <div class="hourly-weather-card-text">${time}</div>
        <div class="hourly-weather-card-icon-div"><img class="hourly-weather-card-icon" src="${weatherDescription.image}" alt=""></div>
        <div class="hourly-weather-card-temp">${temperatureArray[index]}°C</div>
      </div>
    `;
  });

  return html;
}

async function displayContent() {
  const weatherData = await loadWeatherData();
  const current = weatherData.current;
  const daily = weatherData.daily;
  const hourly = weatherData.hourly;
  const weatherDescriptions = await loadWeatherDescriptions();
  genCurrentWeather(current, weatherDescriptions);
  document.querySelector('.js-daily-weather').innerHTML = genDailyWeatherCard(daily, weatherDescriptions);
  document.querySelector('.js-hourly-weather').innerHTML = genHourlyweather(hourly, weatherDescriptions);
}

displayContent();

 
// figure out geolocation api
