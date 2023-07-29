require("dotenv").config({ path: __dirname + "/.env" });
const { twitterClient } = require("./twitterClient.js");
const axios = require('axios');
let apiQuotes = [];

const tweet = async () => {
  try {
    let quote = apiQuotes.pop();
    if (!quote) {
      // If no quote is available, fetch new quotes from the API
      console.log('Geting Quotes');
      await getQuotes();
      console.log('Done!');
    }
    quote = apiQuotes.pop();
    const author = quote.author;
    let secondParameter = '';
    if (author !== 'Anonymous') {
      secondParameter = '\nauthor: ' + author;
    }
    console.log('Sending Tweet');
    await twitterClient.v2.tweet(quote.text + secondParameter);
    console.log('Done! Check @IdrisTheBot');
  } catch (e) {
    console.log(e);
    tweet();
  }
}

// Get Quotes from API
async function getQuotes() {
  const apiURL = "https://jacintodesign.github.io/quotes-api/data/quotes.json";
  try {
    const response = await fetch(apiURL);
    apiQuotes = await response.json();
  } catch (error) {
    console.log(error);
  }
}


// Function to make the GET request
async function makeGetRequest() {
  try {
    const response = await axios.get('https://graceful-coat-bear.cyclic.app/'); // Replace with your API endpoint
    console.log('Response:', response.data); // Do something with the response data
  } catch (error) {
    console.error('Error making GET request:', error);
  }
}


// Schedule the GET request to be made every hour (adjust the interval as needed)
setInterval(() => {
  makeGetRequest();
}, 60 * 60 * 1000); // 1 hour in milliseconds


tweet();

