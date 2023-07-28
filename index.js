require("dotenv").config({ path: __dirname + "/.env" });
const { twitterClient } = require("./twitterClient.js");
const express = require('express');
const app = express();
let apiQuotes = [];

const tweet = async () => {
  try {
    const quote = apiQuotes.pop();
    const author = quote.author;
    let secondParameter = '';
    if (author !== 'Anonymous') {
      secondParameter =  '\nauthor: ' + author;
    }
    await twitterClient.v2.tweet(quote.text + secondParameter);
    return 'Tweeted: ' + quote.text;
  } catch (e) {
    console.log(e);
    return 'Error tweeting';
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

// Start tweeting every 8 hours (adjust the interval as needed)
setInterval(() => {
  if (apiQuotes.length === 0) {
    getQuotes().then(() => {
      tweet();
    });
  } else {
    tweet();
  }
}, 8 * 60 * 60 * 1000); // 8 hours in milliseconds

getQuotes();
// Route to check server status (optional)
app.get('/', async (req, res) => {
  const result = await tweet();
  res.send(result);
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
