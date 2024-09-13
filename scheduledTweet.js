const { twitterClient } = require("./twitterClient.js");
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    await tweet();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Tweet posted successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to post tweet" }),
    };
  }
};

async function tweet() {
  try {
    const data = await fetchApi(); // Fetch data from API
    const event = getRandomEvent(data); // Get a random event from the data

    if (event) {
      const { text, url, year } = event;

      let tweetText = `On This Day: ${year}, ${text}`;
      if (url) {
        tweetText += ` \n\nFor more information visit: ${url} \n\n#OnThisDay`;
      } else {
        tweetText += ` \n\n#OnThisDay`;
      }

      // Split the text into sentences
      const sentences = tweetText.split(/(?<=\.)/);

      let finalTweet = "";
      for (let sentence of sentences) {
        // Check if adding the next sentence will exceed the character limit
        if ((finalTweet + sentence).length <= 280) {
          finalTweet += sentence;
        } else {
          break; // Stop if adding the next sentence will exceed 280 characters
        }
      }

      // If there's a URL and it fits, try adding it
      if (url && (finalTweet.length + url.length + 25) <= 280) {
        finalTweet += ` \n\nFor more information visit: ${url}`;
      }

      // Post the tweet using the Twitter API client
      await twitterClient.v2.tweet(finalTweet);

      console.log("Tweet posted successfully.");
    } else {
      console.log("No event found to tweet.");
    }
  } catch (error) {
    console.error("Error:", error);

    if (error.code === 403) {
      // Handle the error if it's due to a duplicate tweet
      console.log("Duplicate tweet detected. Attempting to retry...");
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay
      await tweet();
    } else {
      // Rethrow other errors
      throw error;
    }
  }
}



async function fetchApi(retries = 3, delay = 1000) {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1; // Months are 0-based in JavaScript
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText} (Status Code: ${response.status})`);
    }

    // Parse the JSON response
    const data = await response.json();
    return data;

  } catch (error) {
    console.error("fetchApi error:", error.message);

    if (retries > 0) {
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      // Retry with increased delay and decreased retry count
      return fetchApi(retries - 1, delay * 2);
    } else {
      // If no retries are left, throw the error
      throw new Error(`Failed to fetch data after multiple attempts: ${error.message}`);
    }
  }
}


function getRandomEvent(data) {
  if (!data || !Array.isArray(data["selected"]) || data["selected"].length === 0) {
    console.error("Invalid data or empty events list.");
    return null;
  }

  const randomIndex = Math.floor(Math.random() * data["selected"].length);
  const selectedEvent = data["selected"][randomIndex];
  const pageDetails = selectedEvent["pages"] && selectedEvent["pages"].length > 0 ? selectedEvent["pages"][0] : {};

  return {
    "text": selectedEvent["text"],
    "url": pageDetails["content_urls"] && pageDetails["content_urls"]["desktop"] ? pageDetails["content_urls"]["desktop"]["page"] : null,
    "year": selectedEvent["year"],
  };
}