require("dotenv").config({ path: __dirname + "/.env" });
const { response } = require("express");
const { twitterClient } = require("./twitterClient.js");
const axios = require('axios');
let apiQuotes = [];
const express = require('express');
const app = express();


/**
 * Tweets a random event fetched from the Wikimedia API.
 *
 * @return {Promise<void>} A Promise that resolves when the tweet is successfully posted.
 * @throws {Error} If there is an error fetching the data or posting the tweet.
 */
const tweet = async () => {
  try { // Start of try block
    const data = await fetchApi(); // Fetch data from the API
    const event = getRandomEvent(data); // Get a random event from the data

    if (event) { // If an event is available
      const { text, url, year } = event; // Destructure the required properties from the event

      let tweetText = `On This Day: ${year}, ${text} \n\nFor more information visit: ${url} \n\n#OnThisDay`; // Construct the tweet text

      while (tweetText.length > 280) {
        // If the tweet text is too long, remove the last sentence
        tweetText = tweetText.slice(0, tweetText.lastIndexOf(" "));
      }

      await twitterClient.v2.tweet(tweetText); // Post the tweet
    }
  } catch (error) { // Start of catch block
    // if tweet is duplicated then try again
    console.log(`Error ${error.code}`);
    if (error.code === 403) {
      console.log("Already tweeted");
      tweet();
    }
    console.error("Error:", error); // Log the error
  }
}

/**
 * Fetches data from the Wikimedia API for today's events.
 *
 * @return {Promise<Object>} A Promise that resolves to the JSON response from the API.
 * @throws {Error} If there is an error fetching the data.
 */
async function fetchApi() {
  // Get the current date and convert it to month and day
  const day = new Date().getDate();
  const month = new Date().getMonth() + 1;

  // Construct the URL for the API request
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`;

  try {
    // Fetch the data from the API
    const response = await fetch(url);

    // Throw an error if the response is not ok
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    // Parse the response as JSON and return it
    const data = await response.json();
    return data;

  } catch (error) {
    // Log the error and return an error object
    console.error("Fetch API error:", error);
    return { error: "Failed to fetch data" };
  }
}

/**
 * Function to get a random event from the data.
 * @param {Object} data - The data object containing the events.
 * @returns {Object|null} - The selected event with text and URL properties, or null if data is invalid or empty.
 */
function getRandomEvent(data) {
  // Ensure 'data' and 'data["selected"]' are valid and 'selected' is not empty
  if (!data || !Array.isArray(data["selected"]) || data["selected"].length === 0) {
      console.error("Invalid data or empty events list.");
      return null;
  }

  // Generate a random index to select an event
  const randomIndex = Math.floor(Math.random() * data["selected"].length);
  const selectedEvent = data["selected"][randomIndex];

  // Extract the first page's details if 'pages' array is present and not empty
  const pageDetails = selectedEvent["pages"] && selectedEvent["pages"].length > 0 ? selectedEvent["pages"][0] : {};

  // Construct the result object with desired properties
  const events = {
      // The text of the event
      "text": selectedEvent["text"],
      // The URL of the event's page on Wikipedia
      "url": pageDetails["content_urls"] && pageDetails["content_urls"]["desktop"] ? pageDetails["content_urls"]["desktop"]["page"] : null,
      // The year of the event
      "year": selectedEvent["year"],
  };

  return events;
}

app.get('/', async (req, res) => {
  console.log('Running Tweet');
  let test = await tweet();
  console.log("Tweeted!")
  res.send('Tweeted! Check @IdrisTheBot on Twitter');
})

app.listen(3000, (req, res) => {
  console.log('Server is running on port 3000');
})
