const express = require("express");
const app = express();
const dotenv = require("dotenv");

const tweetRouter = require("./routes/tweetRouter");

dotenv.config();

const port = process.env.PORT || 3000;

app.use("/tweet", tweetRouter);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});