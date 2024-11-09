const TwitterBot = require('../utils/TwitterBot');

/**
 * Controller for handling tweet posting requests
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.postTweet = async (req, res) => {
    try {
        const result = await TwitterBot.handler();
        
        // Use the statusCode from the handler result
        const statusCode = result.statusCode || 500;
        const message = result.body 
            ? JSON.parse(result.body).message 
            : 'Failed to post tweet';

        return res.status(statusCode).json({ message });
        
    } catch (error) {
        console.error('Controller error: Error posting tweet:', error);
        return res.status(500).json({ 
            message: 'Error occurred while posting tweet',
            error: error.message // Optional: Include error message in development
        });
    }
};