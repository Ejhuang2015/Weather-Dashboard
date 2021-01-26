$(document).ready(function () {
// Variables
    // Search Panel Elements
    const searchButton = document.querySelector("#searchButton");
    const historyPanel = document.querySelector("#historyPanel");
    // Current Weather Panel Elements
    const mainWrapper = document.querySelector("#mainWrapper");
    const cityHeader = document.querySelector("#cityHeaderText");
    const cityHeaderIcon = document.querySelector("#headerIcon");
    const temperature = document.querySelector("#temperature");
    const humidity = document.querySelector("#humidity");
    const windSpeed = document.querySelector("#windSpeed");
    const uvIndex = document.querySelector("#uvIndex");
    // Forecast Panel Elements
    const forecastPanel = document.querySelector(".forecastPanel");
    // Modal Panel Elements
    const modal = document.querySelector("#errModal");
    const closeModal = document.querySelector(".closeModal");
    const errorContent = document.querySelector("#errorContent");
    // Saved Search History Array
    var searchHistoryArray = [];
    // Luxon Date and Time
    var DateTime = luxon.DateTime;
    // OpenWeather API Key
    const apiKey = "d1bff1b060b3a573f9a0a76eda085425";

// Handlers
    // Search Button click
    $(searchButton).on("click", updateHistory);
    // History Panel box click
    $(document).on("click", ".searchHistory", function(){
        searchCityWeather(this.textContent);
    });

// Functions
    // Load search history if available
    function loadSaveData () {
        if (!searchHistoryArray[0]){
            console.log("No saved data");
        }
        else {
            // Remove the invis class from the main wrapper as soon as search data is available
            $(mainWrapper).removeClass("invis");
            // -------------***********---------- Overwrite array based on localstorage (Look at the work day scheduler)
            for (i = 0; i < searchHistoryArray.length; i++) {
                $(historyPanel).prepend('<button class="searchHistory bordered centered">' + searchHistoryArray[i] + '</button>');
            }
        }
    }
    
    function updateHistory(){
        // Remove the invis class from the main wrapper as soon as search data is available
        $(mainWrapper).removeClass("invis");
        
        // The city grabbed from the search bar
        let newCity = $("#searchInput").val().trim();
        // Do nothing if the search bar is empty
        if (!newCity){
            return;
        }
        else {
            // Append the newCity information to the search history array
            searchHistoryArray.unshift(newCity);
            console.log("Array: " + searchHistoryArray);
            // Add a box for each city in the search history array
            $(historyPanel).prepend('<article class="searchHistory bordered centered">' + newCity + '</article>');

            // Search city based on the last new city
            searchCityWeather(searchHistoryArray[0]);
        }
    }
    
    function searchCityWeather(cityName) {
        // The URL link to get information from OpenWeather
        let queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&units=imperial&appid=" + apiKey;

        // Grabs the API return information
        $.ajax({
            url: queryURL,
            method: "GET",
            error: function (err) {
                errorModal(err);
            }
        }).then(function (response) {
            console.log(response);
            updateCurrentWeather(response);
        });
    }

    // Update current weather information
    function updateCurrentWeather (data) {
        // Gets the current time of searched city in UTC
        var localTime = DateTime.fromSeconds(data.dt);
        // Sets the information
        cityHeader.innerHTML = data.name + " " + localTime.month + "/" + localTime.day + "/" + localTime.year;
        cityHeaderIcon.src = "http://openweathermap.org/img/wn/" + data.weather[0].icon + ".png";
        cityHeaderIcon.alt = data.weather[0].description + " weather icon";
        temperature.innerHTML = "Temperature: " + data.main.temp + " F°";
        humidity.innerHTML = "Humidity: " + data.main.humidity + "%";
        windSpeed.innerHTML = "Wind Speed: " + data.wind.speed + "mph";

        // The URL for the One Call API 
        let forecastURL = "https://api.openweathermap.org/data/2.5/onecall?lat=" + data.coord.lat + "&lon=" + data.coord.lon + "&exclude=hourly,minutely&units=imperial&appid=" + apiKey;
        // Gather the API return information
        $.ajax({
            url: forecastURL,
            method: "GET",
            error: function (err) {
                errorModal(err);
            }
        }).then(function (response) {
            console.log("One Call API: ");
            console.log(response);
            updateForecast(response);
        });
    }

    // Updates the forecast information and UV index
    function updateForecast(data) {
        // Get UV index and adds the appropriate class highlight
        var uvIndexReturn = data.current.uvi;
        uvIndex.innerHTML = uvIndexReturn;
        if (uvIndexReturn <= 2){
            $(uvIndex).attr("class", "weatherInfo singleLine highlightGreen");
        }
        else if (2 < uvIndexReturn && uvIndexReturn <= 5){
            $(uvIndex).attr("class", "weatherInfo singleLine highlightYellow");
        }
        else if (5 < uvIndexReturn && uvIndexReturn <= 7){
            $(uvIndex).attr("class", "weatherInfo singleLine highlightOrange");
        }
        else {
            $(uvIndex).attr("class", "weatherInfo singleLine highlightRed");
        }

        // Clear the forecast panel of previous data
        $(forecastPanel).empty();
        // Update the forecast panel
        for (i = 1; i < 6; i++) {
            // Get the forecast date
            var forecastData = data.daily[i];
            var forecastTime = DateTime.fromSeconds(forecastData.dt);
            // Append main card container
            $(forecastPanel).append('<section class="forecastCard flexCol bordered centered" id="card' + i + '"></section>');
            // Append the details to the card container
            $("#card" + i).append('<h3 class="forecastTitle">' + forecastTime.month + "/" + forecastTime.day + "/" + forecastTime.year +'</h3>')
                // Append the weather image
                .append('<img class="weatherIcon forecastIcon" src="http://openweathermap.org/img/wn/' + forecastData.weather[0].icon + '.png" alt="' + forecastData.weather[0].description + ' weather icon"/>')
                // Append the temperature information
                .append('<article class="weatherInfo cardTemperature">Temp: ' + forecastData.temp.day + ' F°</article>')
                // Append the humidity information
                .append('<article class="weatherInfo cardHumidity">Humidity: ' + forecastData.humidity + '%</article>');
        }
    }


    // Modal- Display error modal
    function errorModal(err) {
        modal.style.display = "block";
        errorContent.innerHTML = JSON.stringify(err.status) + " error occured. Please re-enter your city name or choose a different city.";
    }

    // Modal- When the user clicks on <span> (x), close the modal
    closeModal.onclick = function () {
        modal.style.display = "none";
    }

    // Modal- When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Initialize
    function initMain() {
        loadSaveData();
    }

    initMain();

}); //End of Script
