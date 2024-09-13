const express = require("express");
const app = express();
const ejs = require("ejs");
const scheduledTweet = require("./scheduledTweet");
const dotenv = require("dotenv");

dotenv.config();

const port = process.env.PORT || 3000;
const PASSWORD = process.env.PASSWORD;
const USERNAME = process.env.USERNAME_1;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Basic Authentication Middleware
function basicAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log("Auth header:", authHeader);

    if (!authHeader) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Restricted Area"');
        return res.status(401).send("Authentication required.");
    }

    const base64Credentials = authHeader.split(" ")[1];
    if (!base64Credentials) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Restricted Area"');
        return res.status(401).send("Malformed credentials.");
    }

    const credentials = Buffer.from(base64Credentials, "base64").toString("utf8");
    const [username, password] = credentials.split(":");

    if (username === USERNAME && password === PASSWORD) {
        console.log("Authentication successful");
        return next();
    } else {
        console.log("Authentication failed");
        res.setHeader("WWW-Authenticate", 'Basic realm="Restricted Area"');
        return res.status(401).send("Invalid credentials.");
    }
}

app.get("/", (req, res) => {
    res.render("index.ejs", { message: null });
});

// Apply the Basic Authentication only to the /tweet route
app.get("/tweet", basicAuth, async (req, res) => {
    try {
        const tweet = await scheduledTweet.handler();
        if (tweet.statusCode === 200) {
            res.render("index.ejs", { message: "Tweet posted successfully" });
        } else {
            res.render("index.ejs", { message: "Failed to post tweet" });
        }
    } catch (error) {
        console.error("Error posting tweet:", error);
        res.render("index.ejs", { message: "Error occurred while posting tweet" });
    }
});

app.post("/", async (req, res) => {
    const { password } = req.body;

    if (password === PASSWORD) {
        try {
            const tweet = await scheduledTweet.handler();
            if (tweet.statusCode === 200) {
                res.render("index.ejs", { message: "Tweet posted successfully" });
            } else {
                res.render("index.ejs", { message: "Failed to post tweet" });
            }
        } catch (error) {
            console.error("Error posting tweet:", error);
            res.render("index.ejs", { message: "Error occurred while posting tweet" });
        }
    } else {
        res.render("index.ejs", { message: "Incorrect password, unable to post tweet" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});