const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const uri = process.env.MONGODB_URI;

// Create Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    const db = client.db('PromptVerse');
    const prompts = db.collection('prompts');












    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // prompts related api 
        app.post('/api/prompts', async (req, res) => {
            try {
                const prompt = req.body;
                const result = await prompts.insertOne(prompt);

                res.status(200).send({
                    success: true,
                    message: 'prompt added successfully',
                    data: result
                })
            } catch (error) {
                console.log(error);
                res.status(500).send({
                    success: false,
                    message: 'Failed to add prompt ',
                    error: error.message
                })
            }
        });

        app.get('/api/prompts', async (req, res) => {
            try {
                const query = {};
                if (req.query.userId) {
                    query.userId = req.query.userId;
                }

                const cursor = prompts.find(query)
                const result = await cursor.toArray();

                res.status(200).send({
                    success: true,
                    message: 'prompts get successfully',
                    data: result
                })
            } catch (error) {
                console.log(error);
                res.status(500).send({
                    success: false,
                    message: 'Failed get  prompts ',
                    error: error.message
                })
            }
        });











        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);















// Default route
app.get("/", (req, res) => {
    res.send({ message: "promptverse-server" });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

