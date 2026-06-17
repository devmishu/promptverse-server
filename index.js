const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");


// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

// Create Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());















// Default route
app.get("/", (req, res) => {
    res.send({ message: "promptverse-server" });
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
