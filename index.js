const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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

client.connect(() => console.log("connecting to mongo db")).catch(console.log.dir)

// async function run() {
//     try {
// Connect the client to the server	(optional starting in v4.7)
// await client.connect();

const db = client.db('PromptVerse');
const prompts = db.collection('prompts');
const reviews = db.collection('reviews');
const bookmarks = db.collection('bookmarks');
const payments = db.collection('payments');
const reports = db.collection('reports');
const users = db.collection('user');
const sessions = db.collection('session');
const subscriptions = db.collection('subscriptions');


const verifyToken = async (req, res, next) => {
    const header = req.headers.authorization
    if (!header) {
        return res.status(401).send({
            message: "Unauthorize acsess"
        })
    }

    const token = header.split(' ')[1];

    if (!token) {
        return res.status(401).send({
            message: "Unauthorize acsess"
        })
    }

    const query = { token: token }
    const session = await sessions.findOne(query);


    const userId = session?.userId;

    const userQuary = {
        _id: userId
    }
    const user = await users.findOne(userQuary);




    req.user = user;

    next();
}





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

        const result = await prompts
            .find({})
            .project({
                title: 1,
                description: 1,
                thumbnail: 1,
                category: 1,
                aiTool: 1,
                difficulty: 1,
                visibility: 1,
                copyCount: 1
            })
            .toArray();

        res.status(200).send({
            success: true,
            data: result
        });

    } catch (error) {
        res.status(500).send({
            success: false,
            error: error.message
        });
    }
});

// app.get('/api/prompts/:id', verifyToken, async (req, res) => {
//     try {

//         const { id } = req.params;

//         const prompt = await prompts.findOne({
//             _id: new ObjectId(id)
//         });

//         if (!prompt) {
//             return res.status(404).send({
//                 success: false,
//                 message: 'Prompt not found'
//             });
//         }

//         // Public Prompt
//         if (prompt?.visibility === 'free') {
//             return res.status(200).send({
//                 success: true,
//                 message: 'Prompt fetched successfully',
//                 data: prompt
//             });
//         }

//         // Logged in User
//         const user = await users.findOne({
//             email: req.user.email
//         });

//         console.log(prompt);
//         console.log(user);

//         // Premium User 
//         if (user?.plan === 'premium') {
//             return res.status(200).send({
//                 success: true,
//                 message: 'Prompt fetched successfully',
//                 data: prompt
//             });
//         }

//         // Free User + Private Prompt
//         return res.status(200).send({
//             success: true,
//             message: 'Premium prompt locked',
//             data: {
//                 ...prompt,
//                 content: null,
//                 locked: true
//             }
//         });

//     } catch (error) {

//         console.log(error);

//         res.status(500).send({
//             success: false,
//             message: 'Failed to get prompt',
//             error: error.message
//         });

//     }
// });



// app.get('/api/prompts/:id', verifyToken, async (req, res) => {
//     try {

//         const { id } = req.params;

//         const prompt = await prompts.findOne({
//             _id: new ObjectId(id)
//         });

//         if (!prompt) {
//             return res.status(404).send({
//                 success: false,
//                 message: 'Prompt not found'
//             });
//         }

//         if (prompt.visibility === 'free') {
//             return res.status(200).send({
//                 success: true,
//                 data: prompt
//             });
//         }

//         return res.status(200).send({
//             success: true,
//             data: {
//                 ...prompt,
//                 content: null,
//                 locked: true
//             }
//         });

//     } catch (error) {

//         console.log(error);

//         res.status(500).send({
//             success: false,
//             message: 'Failed to get prompt',
//             error: error.message
//         });

//     }
// });

app.get('/api/prompts/:id', verifyToken, async (req, res) => {
    try {

        const { id } = req.params;

        const prompt = await prompts.findOne({
            _id: new ObjectId(id)
        });

        if (!prompt) {
            return res.status(404).send({
                success: false,
                message: 'Prompt not found'
            });
        }

        // Logged in User
        const user = await users.findOne({
            email: req.user.email
        });

        console.log(prompt);
        console.log(user);

        // 🎯 Admin Access: এডমিন হলে যেকোনো প্রম্পটে ফুল অ্যাক্সেস পাবে (কোনো প্ল্যান লাগবে না)
        if (user?.role === 'admin') {
            return res.status(200).send({
                success: true,
                message: 'Prompt fetched successfully by admin',
                data: prompt
            });
        }

        // Public Prompt
        if (prompt?.visibility === 'free') {
            return res.status(200).send({
                success: true,
                message: 'Prompt fetched successfully',
                data: prompt
            });
        }

        // Premium User 
        if (user?.plan === 'premium') {
            return res.status(200).send({
                success: true,
                message: 'Prompt fetched successfully',
                data: prompt
            });
        }

        // Free User + Private Prompt
        return res.status(200).send({
            success: true,
            message: 'Premium prompt locked',
            data: {
                ...prompt,
                content: null,
                locked: true
            }
        });

    } catch (error) {

        console.log(error);

        res.status(500).send({
            success: false,
            message: 'Failed to get prompt',
            error: error.message
        });

    }
});


app.get('/api/my/prompts', async (req, res) => {
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

app.get('/api/admin/prompts', async (req, res) => {
    try {

        const result = await prompts.find().toArray();

        res.status(200).send({
            success: true,
            message: 'all prompts get successfully',
            data: result
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  all prompts ',
            error: error.message
        })
    }
});

app.delete('/api/prompt/:id', async (req, res) => {

    const { id } = req.params;

    console.log(id);

    const query = {
        _id: new ObjectId(id)
    }

    try {

        const deletePrompt = await prompts.deleteOne(query);

        console.log(deletePrompt);

        res.status(200).send({
            success: true,
            message: 'Delete prompt successfully',
            data: deletePrompt
        });

    } catch (error) {

        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Delete prompt failed',
            error: error.message
        });
    }
});

// edit my added cars
app.patch('/api/prompts/:id', async (req, res) => {

    const data = req.body;
    const { id } = req.params;
    const query = {
        _id: new ObjectId(id)
    }
    const document = {
        $set: data
    }

    try {
        const editedPrompt = await prompts.updateOne(query, document);
        res.status(200).send({
            success: true,
            message: 'Edit prompt successfully',
            data: editedPrompt
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Edit prompt  failed',
            error: error.message
        });
    }
});





// bookmark related api
// app.post('/api/bookmarks', async (req, res) => {
//     try {
//         const bookmark = req.body;
//         const result = await bookmarks.insertOne(bookmark);

//         res.status(200).send({
//             success: true,
//             message: 'prompt bookmarked successfully',
//             data: result
//         })
//     } catch (error) {
//         console.log(error);
//         res.status(500).send({
//             success: false,
//             message: 'Failed to add prompt ',
//             error: error.message
//         })
//     }
// });

app.post('/api/bookmarks', async (req, res) => {
    try {
        const bookmark = req.body;

        // ১. বডি থেকে userId এবং promptId আলাদা করা হচ্ছে
        const { userId, promptId } = bookmark; // আপনার ফ্রন্টেন্ড স্ট্রাকচারে প্রম্পটের আইডিটি সম্ভবত _id নামে যাচ্ছে

        if (!userId || !promptId) {
            return res.status(400).send({
                success: false,
                message: 'userId and promptId are required'
            });
        }

        // ২. ডাটাবেজে চেক করা হচ্ছে এই ইউজার এই প্রম্পট অলরেডি বুকমার্ক করেছে কিনা
        const existingBookmark = await bookmarks.findOne({ userId: userId, _id: promptId });

        if (existingBookmark) {
            return res.status(400).send({
                success: false,
                alreadyBookmarked: true, // ফ্রন্টেন্ড ট্র্যাকিংয়ের জন্য
                message: 'You have already bookmarked this prompt.'
            });
        }

        // ৩. ডুপ্লিকেট না থাকলে নতুন বুকমার্ক ইনসার্ট হবে
        const result = await bookmarks.insertOne(bookmark);

        res.status(200).send({
            success: true,
            message: 'Prompt bookmarked successfully',
            data: result
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed to add bookmark',
            error: error.message
        });
    }
});

app.get('/api/my/bookmarks', verifyToken, async (req, res) => {
    try {
        const query = {};
        if (req.query.userId) {
            query.userId = req.query.userId;
        }

        const cursor = await bookmarks.find(query)
        const result = await cursor.toArray();

        res.status(200).send({
            success: true,
            message: 'my bookmarks get successfully',
            data: result
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  my bookmarks ',
            error: error.message
        })
    }
});

app.delete('/api/bookmarks/:id', async (req, res) => {

    const { id } = req.params;

    console.log(id);

    const query = {
        _id: new ObjectId(id)
    }

    try {

        const deleteBookmark = await bookmarks.deleteOne(query);

        console.log(deleteBookmark);

        res.status(200).send({
            success: true,
            message: 'Delete bookmark successfully',
            data: deleteBookmark
        });

    } catch (error) {

        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Delete bookmark failed',
            error: error.message
        });
    }
});

// reviews related api 
app.post('/api/reviews', async (req, res) => {
    try {
        const review = req.body;

        // ১. বডি থেকে userId এবং promptId আলাদা করে নেওয়া হচ্ছে (আপনার ডাটা স্ট্রাকচার অনুযায়ী ফিল্ডের নাম নিশ্চিত হয়ে নিবেন)
        const { userId, promptId } = review;

        if (!userId || !promptId) {
            return res.status(400).send({
                success: false,
                message: 'userId and promptId are required'
            });
        }

        // ২. ডাটাবেজে চেক করা হচ্ছে এই ইউজার এই প্রম্পটে অলরেডি রিভিউ দিয়েছে কিনা
        const existingReview = await reviews.findOne({ userId: userId, promptId: promptId });

        if (existingReview) {
            return res.status(400).send({
                success: false,
                alreadyReviewed: true, // ফ্রন্টেন্ডে ট্র্যাকিং সহজ করার জন্য
                message: 'You have already reviewed this prompt.'
            });
        }

        const reviewInfo = {
            ...review,
            createdAt: new Date().toLocaleString(),
        }
        // ৩. অলরেডি রিভিউ না থাকলে নতুন রিভিউ ডাটাবেজে সেভ হবে
        const result = await reviews.insertOne(reviewInfo);

        res.status(200).send({
            success: true,
            message: 'Review added successfully',
            data: result
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed to add review',
            error: error.message
        });
    }
});

app.get('/api/my/reviews', async (req, res) => {
    try {
        const query = {};
        if (req.query.userId) {
            query.userId = req.query.userId;
        }

        const cursor = await reviews.find(query)
        const result = await cursor.toArray();

        res.status(200).send({
            success: true,
            message: 'my reviews get successfully',
            data: result
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  my reviews ',
            error: error.message
        })
    }
});

app.get('/api/prompt/reviews', async (req, res) => {
    try {
        const query = {};
        if (req.query.promptId) {
            query.promptId = req.query.promptId;
        }

        const cursor = await reviews.find(query)
        const result = await cursor.toArray();

        res.status(200).send({
            success: true,
            message: 'Prompt reviews get successfully',
            data: result
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  Prompt reviews ',
            error: error.message
        })
    }
});






// ১. নতুন রিপোর্ট তৈরি করার POST API
app.post('/api/reports', async (req, res) => {
    try {
        const report = req.body;

        // বডি থেকে userId এবং promptId আলাদা করা হচ্ছে
        const { userId, promptId } = report;

        if (!userId || !promptId) {
            return res.status(400).send({
                success: false,
                message: 'userId and promptId are required'
            });
        }

        // ডাটাবেজে চেক করা হচ্ছে এই ইউজার এই প্রম্পটে অলরেডি রিপোর্ট দিয়েছে কিনা
        const existingReport = await reports.findOne({ userId: userId, promptId: promptId });

        if (existingReport) {
            return res.status(400).send({
                success: false,
                alreadyReported: true, // ফ্রন্টেন্ডে ট্র্যাকিং সহজ করার জন্য
                message: 'You have already reported this prompt.'
            });
        }

        // অলরেডি রিপোর্ট না থাকলে নতুন রিপোর্ট ডাটাবেজে সেভ হবে
        const result = await reports.insertOne(report);

        res.status(200).send({
            success: true,
            message: 'Report submitted successfully',
            data: result
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed to submit report',
            error: error.message
        });
    }
});

app.get('/api/admin/reports', async (req, res) => {
    try {

        const result = await reports.find().toArray();

        res.status(200).send({
            success: true,
            message: 'all reports get successfully',
            data: result
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  all reports ',
            error: error.message
        })
    }
});

app.delete('/api/admin/reports/:id', async (req, res) => {

    const { id } = req.params;

    console.log(id);

    const query = {
        _id: new ObjectId(id)
    }

    try {

        const deleteReport = await reports.deleteOne(query);


        res.status(200).send({
            success: true,
            message: 'Delete reports successfully',
            data: deleteReport
        });

    } catch (error) {

        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Delete reports failed',
            error: error.message
        });
    }
});





// stripe pamyent related api

app.post('/api/subscriptions', async (req, res) => {
    try {
        const subscription = req.body;
        console.log("planId:,,", subscription.planId);

        const subsInfo = {
            ...subscription,
            createdAt: new Date(),
        }

        const subscriptionResult = await subscriptions.insertOne(subsInfo);

        const updateDocument = {
            $set: {
                plan: subscription.planId, // আপনার রিকোয়েস্ট বডিতে planId থাকতে হবে
            },
        };

        const filter = { email: subscription.email };
        console.log("email....", subscription.email);
        const userResult = await users.updateOne(filter, updateDocument);



        res.status(200).send({
            success: true,
            message: 'Subscription created and user plan updated successfully',
            subscriptionData: subscriptionResult,
            userData: userResult
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed to complete subscription process',
            error: error.message
        });
    }
});


app.get('/api/admin/subscriptions', async (req, res) => {
    try {

        const result = await subscriptions.find().toArray();

        res.status(200).send({
            success: true,
            message: 'all subscriptions get successfully',
            data: result
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  all subscriptions ',
            error: error.message
        })
    }
});






module.exports = app;










// Send a ping to confirm a successful connection
// await client.db("admin").command({ ping: 1 });
//         console.log("Pinged your deployment. You successfully connected to MongoDB!");
//     } finally {
//         // Ensures that the client will close when you finish/error
//         // await client.close();
//     }
// }
// run().catch(console.dir);















// Default route
app.get("/", (req, res) => {
    res.send({ message: "promptverse-server" });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


/**
 * tumi amr ay website them collor use kore amr jonno akta profile components banaw :
 * content: 
 * top: profile photo,email, name, plan jodi premium hoy premium badge,  role badge, arekta plan badge lifitime, 
 * midle: 2 ta card takbe aktate Prompts Published length,icon and areck ta card acount varification status, 
 * last: user ar plan jodi free take tahole plan upgrade korar jonno detail page je upgrade card ta use korecile ota same to same use korbe ar jodi plan premium take tahple akta right mark icon and akta message leka takbe lifitim premium........................
 * using hero ui (version 3.0.1) data gula sob props akare jabe
 */