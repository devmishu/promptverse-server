const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

client.connect(() => console.log("connecting to mongo db")).catch(console.log.dir);

const db = client.db('PromptVerse');

const prompts = db.collection('prompts');
const reviews = db.collection('reviews');
const bookmarks = db.collection('bookmarks');
const payments = db.collection('payments');
const reports = db.collection('reports');
const users = db.collection('user');
const sessions = db.collection('session');
const subscriptions = db.collection('subscriptions');
const warnings = db.collection('warnings');

module.exports = {
    client,
    db,
    prompts,
    reviews,
    bookmarks,
    payments,
    reports,
    users,
    sessions,
    subscriptions,
    warnings
};
