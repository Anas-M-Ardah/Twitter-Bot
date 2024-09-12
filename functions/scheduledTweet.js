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
    const data = await fetchApi();
    const event = getRandomEvent(data);

    if (event) {
      const { text, url, year } = event;

      let tweetText = `On This Day: ${year}, ${text} \n\nFor more information visit: ${url} \n\n#OnThisDay`;

      while (tweetText.length > 280) {
        tweetText = tweetText.slice(0, tweetText.lastIndexOf(" "));
      }

      await twitterClient.v2.tweet(tweetText);
    }
  } catch (error) {
    console.error("Error:", error);
    if (error.code === 403) {
      console.log("Already tweeted");
      await tweet();
    } else {
      throw error;
    }
  }
}

async function fetchApi() {
  const day = new Date().getDate();
  const month = new Date().getMonth() + 1;
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching data: ${response.statusText}`);
  }
  return response.json();
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