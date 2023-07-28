require("dotenv").config({ path: __dirname + "/.env" });
const { twitterClient } = require("./twitterClient.js");
let apiQuotes = [];

const tweet = async () => {
  try {
    const quote = apiQuotes.pop();
    const author = quote.author;
    let secondParameter = '';
    if(author !== 'Anonymous' ){
      secondParameter =  '\nauthor: '+author;
    }
    await twitterClient.v2.tweet(quote.text + secondParameter);
  } catch (e) {
    console.log(e);
  }
}


// Get Quotes from API
async function getQuotes(){
    const apiURL = "https://jacintodesign.github.io/quotes-api/data/quotes.json";
    try{
        const response = await fetch(apiURL);
        apiQuotes = await response.json();
    }catch(error){
        console.log(error);
    }
}

// Tweets every 8 hours (adjust the interval as needed)
setInterval(() => {
  start();
}, 8 * 60 * 60 * 1000); // 24 hours in milliseconds

async function start(){
  if(apiQuotes.length === 0){
    await getQuotes();
  }
  tweet();
}

// Test the app
const test = 1;
if(test === 1){
  start();
  test--;
}




