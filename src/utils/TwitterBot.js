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

  static getRandomEvent(data) {
    if (!data?.data?.Events?.length) {
      throw new Error('Invalid data or empty events list');
    }

    const events = data.data.Events;
    const randomIndex = Math.floor(Math.random() * events.length);
    const event = events[randomIndex];
    
    // Remove HTML entities and tags
    const cleanText = event.text
      .replace(/&#\d+;/g, '') // Remove numeric HTML entities
      .replace(/&[a-zA-Z]+;/g, '') // Remove named HTML entities
      .replace(/<[^>]*>/g, ''); // Remove HTML tags
    
    // Extract year from the beginning of the text
    const year = cleanText.split(' ')[0];
    
    // Remove the year from the beginning and clean up any extra spaces
    const textWithoutYear = cleanText.substring(year.length).trim();
    
    // Find the most relevant Wikipedia link
    let wikiLink = null;
    if (event.links) {
      // Convert links object to array and find the most relevant link
      const linksArray = Object.values(event.links);
      
      // Try to find a link that contains key terms from the event text
      const keywords = textWithoutYear
        .toLowerCase()
        .split(' ')
        .filter(word => word.length > 3) // Filter out short words
        .slice(0, 3); // Take first 3 significant words

      for (const link of linksArray) {
        const linkUrl = link[1].toLowerCase();
        const linkText = link[2].toLowerCase();
        
        // Check if the link text or URL contains any of our keywords
        if (keywords.some(keyword => 
          linkText.includes(keyword) || 
          linkUrl.includes(keyword))) {
          wikiLink = link[1];
          break;
        }
      }

      // If no relevant link found, use the first link as fallback
      if (!wikiLink && linksArray.length > 0) {
        wikiLink = linksArray[0][1];
      }
    }
    
    return {
      text: textWithoutYear,
      year: year,
      url: wikiLink
    };
  }

  static formatTweetText({ text, year, url, additionalInfo }) {
    // Start with the hashtag and main event
    let tweetText = `#OnThisDay in ${year}: ${text}`;
    
    // Add additional info if available and meaningful
    if (additionalInfo && additionalInfo.length > 0) {
      tweetText += `\n\n${additionalInfo}`;
    }
    
    // Add the URL if available
    if (url) {
      tweetText += `\n\nRead more: ${url}`;
    }

    // Log the final tweet text for debugging
    console.log('Final tweet text before truncation:', tweetText);

    // Ensure we don't exceed the maximum length
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
      await twitterClient.v2.tweet(tweetText);
      console.log('Tweet posted successfully');
      console.log('Tweet content:', tweetText);

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