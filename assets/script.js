$(document).ready(function () {
// Variables
    // Search Panel Elements
    const searchButton = document.querySelector("#searchButton");
    const searchInput = document.querySelector("#searchInput");
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
    // Footer Panel Elements
    const clearButton = document.querySelector("#clearButton");
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
        searchCityWeather(this.textContent,false);
    });
    // Clear Button click
    $(clearButton).on("click", function(){
        // Hide the weather panel
        $(mainWrapper).addClass("invis");
        // Reset the search history array
        searchHistoryArray = [];
        // Save the empty array into the local storage data
        localStorage.setItem("weatherHistoryData", JSON.stringify(searchHistoryArray)); 
        // Clear the panels of previous data
        cityHeader.innerHTML = "";
        cityHeaderIcon.src = "";
        cityHeaderIcon.alt = "";
        temperature.innerHTML = "";
        humidity.innerHTML = "";
        windSpeed.innerHTML = "";
        $(historyPanel).empty();
        $(forecastPanel).empty();
    });
    
// Functions
    // Load search history if available
    function loadSaveData () {
        // Grab the local storage data
        var storedSearchData = JSON.parse(localStorage.getItem("weatherHistoryData"));
        console.log(storedSearchData);
        // Check if stored data is empty or non-existent
        if (!storedSearchData || storedSearchData.length == 0){
            console.log("No saved data");
            return;
        }
        else {
            // Remove the invis class from the main wrapper if there is saved data
            $(mainWrapper).removeClass("invis");
            // Overwrite array based on localstorage
            storedSearchData.forEach((item) =>{
                searchHistoryArray = [...storedSearchData];
            });
            for (i = 0; i < searchHistoryArray.length; i++) {
                $(historyPanel).append('<article class="searchHistory bordered centered">' + searchHistoryArray[i] + '</article>');
            }
            // Search city based on last search but don't update the array
            searchCityWeather(searchHistoryArray[0],false);
        }
    }
    
    function updateHistory(){
        // The city grabbed from the search bar
        let newCity = $(searchInput).val().trim();
        // Clear the search bar now that data is saved
        searchInput.value = "";
        // Bring up the empy error modal if search bar is empty
        if (!newCity){
            emptyModal();
            return;
        }
        else {
            // Search city based on the input and reload array
            searchCityWeather(newCity,true);
        }
    }
    
    function searchCityWeather(cityName,activateUpdateArray) {
        // The URL link to get information from OpenWeather
        let queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&units=imperial&appid=" + apiKey;

        // Grabs the API return information
        $.ajax({
            url: queryURL,
            method: "GET",
            error: function (err) {
                // Opens the error modal if an error is returned
                errorModal(err);
            }
        }).then(function (response) {
            updateCurrentWeather(response);
            // Only update the array if the search button is pressed and not on reload
            if (activateUpdateArray == true) {
                updateArray(response.name);
                // Remove the invis class
                $(mainWrapper).removeClass("invis");
            }
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

    // Updates the array and history
    function updateArray(newCity) {
        // Add a box for the new city in the history
        $(historyPanel).prepend('<article class="searchHistory bordered centered">' + newCity + '</article>');
        // Append the newCity information to the search history array
        searchHistoryArray.unshift(newCity);
        // Save the updated array into local storage
        localStorage.setItem("weatherHistoryData", JSON.stringify(searchHistoryArray)); 
    }

    // Modal- Display empty error modal
    function emptyModal() {
        modal.style.display = "block";
        errorContent.innerHTML = "Please enter a city name!";
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
