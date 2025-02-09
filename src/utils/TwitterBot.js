const { twitterClient } = require('./twitterClient.js');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

// Constants
const TWEET_MAX_LENGTH = 280;
const API_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,
  DUPLICATE_RETRY_DELAY: 3000
};

class TwitterBot {
  /**
   * Handles the API request for posting a tweet
   */
  static async postTweet(req, res) {
    try {
      const result = await this.handler();
      return res.status(result.statusCode).json({
        message: result.body ? JSON.parse(result.body).message : 'Failed to post tweet'
      });
    } catch (error) {
      console.error('Error posting tweet:', error);
      return res.status(500).json({ message: 'Error occurred while posting tweet' });
    }
  }

  /**
   * Main handler for the tweet posting process
   */
  static async handler() {
    try {
      await this.tweet();
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Tweet posted successfully' })
      };
    } catch (error) {
      console.error('Handler error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message || 'Failed to post tweet' })
      };
    }
  }

  /**
   * Fetches data from the Wikipedia API
   */
  static async fetchApi(retries = API_CONFIG.MAX_RETRIES, delay = API_CONFIG.INITIAL_DELAY) {
    const today = new Date();
    const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${today.getMonth() + 1}/${today.getDate()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
      }
      return await response.json();
    } catch (error) {
      console.error('fetchApi error:', error.message);

      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchApi(retries - 1, delay * 2);
      }
      throw new Error(`Failed to fetch data after ${API_CONFIG.MAX_RETRIES} attempts: ${error.message}`);
    }
  }

  /**
   * Selects a random event from the API data
   */
  static getRandomEvent(data) {
    if (!data?.selected?.length) {
      throw new Error('Invalid data or empty events list');
    }

    const event = data.selected[Math.floor(Math.random() * data.selected.length)];
    const pageDetails = event.pages?.[0] || {};

    return {
      text: event.text,
      url: pageDetails.content_urls?.desktop?.page || null,
      year: event.year
    };
  }

  /**
   * Formats the tweet text within Twitter's character limit
   */
  static formatTweetText({ text, url, year }) {
    let tweetText = `On This Day: ${year}, ${text}`;
    const sentences = tweetText.split(/(?<=\.)/);

    let finalTweet = '';
    for (const sentence of sentences) {
      if ((finalTweet + sentence).length <= TWEET_MAX_LENGTH) {
        finalTweet += sentence;
      } else {
        break;
      }
    }

    if (url && (finalTweet.length + url.length + 25) <= TWEET_MAX_LENGTH) {
      finalTweet += ` \n\nFor more information visit: ${url}`;
    }

    finalTweet += ' \n\n#OnThisDay';
    return finalTweet.slice(0, TWEET_MAX_LENGTH);
  }

  /**
   * Main tweet posting function
   */
  static async tweet() {
    try {
      const data = await this.fetchApi();
      const event = this.getRandomEvent(data);

      if (!event) {
        throw new Error('No valid event found to tweet');
      }

      console.log('Posting tweet...');

      const tweetText = this.formatTweetText(event);
      await twitterClient.v2.tweet(tweetText);
      console.log('Tweet posted successfully');

    } catch (error) {
      if (error.code === 403) {
        console.log('Duplicate tweet detected. Retrying...');
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.DUPLICATE_RETRY_DELAY));
        return this.tweet();
      }
      throw error;
    }
  }
}

module.exports = TwitterBot;