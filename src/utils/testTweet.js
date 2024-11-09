const { handler } = require('./scheduledTweet');

exports.handler = async (event, context) => {
  console.log('Testing scheduled tweet function');
  return handler(event, context);
};