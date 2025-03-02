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

/**
 * Controller for initializing/saving all tweets
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.saveAllTweets = async (req, res) => {
    try {
        await TwitterBot.initialize();
        const information = TwitterBot.getInformation();
        return res.status(200).json({ 
            message: 'All tweets saved successfully', 
            data: information 
        });
    } catch (error) {
        console.error('Controller error: Error saving all tweets:', error);
        return res.status(500).json({ 
            message: 'Error occurred while saving all tweets',
            error: error.message
        });
    }
};

/**
 * Controller for updating stored information
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.updateInformation = async (req, res) => {
    try {
        const updatedInfo = await TwitterBot.updateInformation();
        return res.status(200).json({ 
            message: 'Information updated successfully', 
            data: updatedInfo 
        });
    } catch (error) {
        console.error('Controller error: Error updating information:', error);
        return res.status(500).json({ 
            message: 'Error occurred while updating information',
            error: error.message
        });
    }
};

exports.updateInformationSilently = async (req, res) => {
    try{
        const updatedInfo = await TwitterBot.updateInformation();
        return res.status(200).json({ 
            message: 'Information updated successfully',  
        });
    } catch (error) {
        console.error('Controller error: Error updating information:', error);
        return res.status(500).json({ 
            message: 'Error occurred while updating information',
            error: error.message
        });
    }
}

/**
 * Controller for getting current stored information
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getCurrentInformation = async (req, res) => {
    try {
        const information = TwitterBot.getInformation();
        if (!information) {
            return res.status(404).json({ 
                message: 'No information currently stored'
            });
        }
        return res.status(200).json({ 
            message: 'Information retrieved successfully', 
            data: information 
        });
    } catch (error) {
        console.error('Controller error: Error getting information:', error);
        return res.status(500).json({ 
            message: 'Error occurred while retrieving information',
            error: error.message
        });
    }
};