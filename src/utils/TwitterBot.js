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
  static information = null;

  static async initialize() {
    try {
      if (!this.information) {
        this.information = await this.fetchApi();
        console.log('Information fetched and stored successfully');
      }
      return this.information;
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  }

  static getInformation() {
    return this.information;
  }

  static async updateInformation() {
    try {
      this.information = await this.fetchApi();
      console.log('Information updated successfully');
      return this.information;
    } catch (error) {
      console.error('Update information error:', error);
      throw error;
    }
  }

  static async fetchApi(retries = API_CONFIG.MAX_RETRIES, delay = API_CONFIG.INITIAL_DELAY) {
    const today = new Date();
    const month = today.toLocaleString('default', { month: 'long' });
    const day = today.getDate();
    const url = `https://today.zenquotes.io/api/${month}_${day}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('fetchApi error:', error.message);

      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchApi(retries - 1, delay * 2);
      }
      throw new Error(`Failed to fetch data after ${API_CONFIG.MAX_RETRIES} attempts: ${error.message}`);
    }
  }

  static async fetchWikipediaImage(searchTerm) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchTerm)}&prop=pageimages&format=json&pithumbsize=800&origin=*`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      return pages[pageId]?.thumbnail?.source;
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  }

  static getRandomEvent(data) {
    if (!data?.data?.Events?.length) {
      throw new Error('Invalid data or empty events list');
    }

    const events = data.data.Events;
    const randomIndex = Math.floor(Math.random() * events.length);
    const event = events[randomIndex];
    
    // Remove HTML entities and tags
    const cleanText = event.text.replace(/&#\d+;/g, '').replace(/&[a-zA-Z]+;/g, '');
    
    // Get the first Wikipedia link from the event
    const wikiLink = event.links && Object.values(event.links)[0]?.[1];
    
    return {
      text: cleanText,
      url: wikiLink,
      year: cleanText.split(' ')[0]
    };
  }

  static formatTweetText({ text, url, year }) {
    let tweetText = `#OnThisDay ${text}`;
    
    if (url) {
      const remainingLength = TWEET_MAX_LENGTH - 25; // Account for URL length and spacing
      tweetText = tweetText.slice(0, remainingLength) + `\n\nMore info: ${url}`;
    }

    return tweetText.slice(0, TWEET_MAX_LENGTH);
  }

  static async tweet() {
    try {
      if (this.needsRefresh()) {
        await this.updateInformation();
        console.log('Information refreshed due to empty or missing data');
      }
      
      const event = this.getRandomEvent(this.information);
      if (!event) {
        throw new Error('No valid event found to tweet');
      }

      const tweetText = this.formatTweetText(event);
      
      // Try to fetch a relevant image
      const searchTerm = event.text.split(' ').slice(1).join(' ').split(',')[0];
      const imageUrl = await this.fetchWikipediaImage(searchTerm);
      
      if (imageUrl) {
        // Download the image
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.buffer();
        
        // Upload the image to Twitter
        const mediaId = await twitterClient.v1.uploadMedia(imageBuffer);
        
        // Post tweet with media
        await twitterClient.v2.tweet({
          text: tweetText,
          media: { media_ids: [mediaId] }
        });
      } else {
        // Post tweet without media
        await twitterClient.v2.tweet(tweetText);
      }

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

  static needsRefresh() {
    return !this.information || !this.information.data || !this.information.data.Events;
  }

  static getRemainingEventsCount() {
    return this.information?.data?.Events?.length || 0;
  }

  static async postTweet(req, res) {
    try {
      if (!this.information) {
        await this.initialize();
      }
      const result = await this.handler();
      return res.status(result.statusCode).json({
        message: result.body ? JSON.parse(result.body).message : 'Failed to post tweet'
      });
    } catch (error) {
      console.error('Error posting tweet:', error);
      return res.status(500).json({ message: 'Error occurred while posting tweet' });
    }
  }

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
}

module.exports = TwitterBot;