require("dotenv").config({ path: __dirname + "/.env" });
const { twitterClient } = require("./twitterClient.js");
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

// Call the tweet function initially to start tweeting
tweet();

// Tweets every 8 hours (adjust the interval as needed)
setInterval(() => {
  tweet();
}, 8 * 60 * 60 * 1000); // 8 hours in milliseconds
