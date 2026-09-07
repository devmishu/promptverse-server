const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables
dotenv.config();

// Initialize Database connection
require("./config/db");

// Import modular API router
const apiRoutes = require("./routes");

const PORT = process.env.PORT || 4000;

// Create Express application
const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Mount modular API routes under /api
app.use("/api", apiRoutes);

// Default root route
app.get("/", (req, res) => {
    res.send({ message: "promptverse-server" });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
