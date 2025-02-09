const axios = require('axios');

// Add this to your application
function keepAlive() {
    const url = "https://twitter-bot-y1c3.onrender.com";
    setInterval(async () => {
        try {
            const response = await axios.get(url);
            console.log('Keep-alive ping sent');
        } catch (error) {
            console.error('Keep-alive ping failed:', error);
        }
    }, 10); // 14 minutes (Render free tier sleeps after 15 minutes of inactivity)
}

keepAlive();