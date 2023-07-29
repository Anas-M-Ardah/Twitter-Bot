require("dotenv").config({ path: __dirname + "/.env" });
const { twitterClient } = require("./twitterClient.js");
const express = require('express');
const app = express();
const CronJob = require('cron').CronJob;
let apiQuotes = [];

const tweet = async () => {
  console.log('running tweet');
  try {
    if (apiQuotes.length === 0) {
      await getQuotes();
    }
    if (apiQuotes.length > 0) {
      const quote = apiQuotes.pop();
      const author = quote.author;
      let secondParameter = '';
      if (author !== 'Anonymous') {
        secondParameter =  '\nauthor: ' + author;
      }
      await twitterClient.v2.tweet(quote.text + secondParameter);
      console.log('Tweeted:', quote.text);
    } else {
      console.log('No quotes available for tweeting.');
    }
  } catch (e) {
    apiQuotes.pop();
    console.error('Error tweeting:', e);
  }
}

// Get Quotes from API
async function getQuotes() {
  const apiURL = "https://jacintodesign.github.io/quotes-api/data/quotes.json";
  try {
    const response = await fetch(apiURL);
    apiQuotes = await response.json();
  } catch (error) {
    console.error('Error fetching quotes from API:', error);
  }
}

const job = new CronJob("* * * * * *", () => {
  tweet();
});

app.get('/', (req, res) => {
  console.log(tweet());
  res.send('Tweeted');
})

app.listen(3000, (req, res) => {
  console.log('Server is running on port 3000');
});


