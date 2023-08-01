require("dotenv").config({ path: __dirname + "/.env" });
const { response } = require("express");
const { twitterClient } = require("./twitterClient.js");
const axios = require('axios');
let apiQuotes = [];
const express = require('express');
const app = express();

const tweet = async () => {
  try {
    let quote = apiQuotes.pop();
    if (!quote) {
      // If no quote is available, fetch new quotes from the API
      console.log('Geting Quotes');
      await getQuotes();
      console.log('Done!');
    }
    console.log(apiQuotes);
    quote = apiQuotes.pop();
    const author = quote.author;
    let secondParameter = '';
    if (author !== 'Anonymous') {
      secondParameter = '\nauthor: ' + author;
    }
    console.log('Sending Tweet');
    await twitterClient.v2.tweet(quote.content + secondParameter);
    console.log('Done! Check @IdrisTheBot');
  } catch (e) {
    if(e.data.title !== 'Too Many Requests'){
      tweet();
    }
    console.log('Unable to send tweet too many requests were made come back tommorow :)');
  }
}

// Get Quotes from API
async function getQuotes() {
  const apiURL = "https://api.quotable.io/quotes/random?limit=1";
  try {
    const response = await fetch(apiURL);
    apiQuotes = await response.json();
  } catch (error) {
    console.log(error);
  }
}


app.get('/', async (req, res) => {
  console.log('Running Tweet');
  let test = await tweet();
  res.send('Tweeted! Check @IdrisTheBot on Twitter');
})

app.listen(3000, (req, res) => {
  console.log('Server is running on port 3000');
})
