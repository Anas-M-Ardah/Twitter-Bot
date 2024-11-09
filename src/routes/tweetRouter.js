const { postTweet } = require("../controller/tweetController");
const express = require("express");
const router = express.Router();

router.post("/postTweet", postTweet);

module.exports = router;