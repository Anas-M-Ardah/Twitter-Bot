const { TwitterApi } = require("twitter-api-v2");
const dotenv = require('dotenv');

dotenv.config();

//------------------------------ FOR TESTING PURPOSES ------------------------------
// Check if environment variables are loaded correctly
// console.log('API_KEY:', process.env.API_KEY);
// console.log('API_SECRET:', process.env.API_SECRET);
// console.log('ACCESS_TOKEN:', process.env.ACCESS_TOKEN);
// console.log('ACCESS_SECRET:', process.env.ACCESS_SECRET);
// console.log('BEARER_TOKEN:', process.env.BEARER_TOKEN);

const client = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET,
});

const bearer = new TwitterApi(process.env.BEARER_TOKEN);

const twitterClient = client.readWrite;
const twitterBearer = bearer.readOnly;

// Check if clients are properly initialized
if (!twitterClient || !twitterBearer) {
  console.error('Error initializing Twitter clients');
} else {
  console.log('Twitter clients initialized successfully');
}

module.exports = { twitterClient, twitterBearer };
