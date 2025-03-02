const { postTweet, saveAllTweets, updateInformation, getCurrentInformation } = require("../controller/tweetController");
const express = require("express");
const router = express.Router();

router.post("/postTweet", postTweet);

router.get("/tweet", postTweet);
router.get("/saveAllTweets", saveAllTweets);
router.get('/update-information', updateInformation);
router.get('/current-information', getCurrentInformation);

module.exports = router;