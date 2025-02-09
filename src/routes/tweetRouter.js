const { postTweet } = require("../controller/tweetController");
const express = require("express");
const router = express.Router();

router.post("/postTweet", postTweet);
router.get("/tweet", postTweet);

module.exports = router;