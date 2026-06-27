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

    console.log("user token:", token);

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

const verifyUser = (req, res, next) => {
    if (req.user?.role !== "user") {
        return res.status(403).send({ message: "Forbidden accsess" });
    }
    next();
}
const verifyCreator = (req, res, next) => {
    if (req.user?.role !== "creator") {
        return res.status(403).send({ message: "Forbidden accsess" });
    }
    next();
}

const verifyAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).send({ message: "Forbidden accsess" });
    }
    next();
}



// prompts related api 
app.post('/api/prompts', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const prompt = req.body;

        const promptInfo = {
            ...prompt,
            createdAt: new Date(),
        }
        const result = await prompts.insertOne(promptInfo);

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

        const {
            search,
            sort,
            aiTool,
            category,
            difficulty,
            page,
            itemsPerPage
        } = req.query;

        let query = {
            status: 'approved'
        };

        // Search
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { aiTool: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        // Filters
        if (aiTool) {
            query.aiTool = {
                $regex: `^${aiTool.trim()}$`,
                $options: 'i'
            };
        }

        if (category) {
            query.category = {
                $regex: `^${category.trim()}$`,
                $options: 'i'
            };
        }

        if (difficulty) {
            query.difficulty = {
                $regex: `^${difficulty.trim()}$`,
                $options: 'i'
            };
        }

        // Sorting
        let sortOption = { _id: -1 };

        if (sort === 'most-copied' || sort === 'most-popular') {
            sortOption = { copyCount: -1 };
        } else if (sort === 'latest') {
            sortOption = { createdAt: -1 };
        }

        // Total count for pagination
        const total = await prompts.countDocuments(query);

        const currentPage = parseInt(page) || 1;
        const limit = parseInt(itemsPerPage) || 8;
        const skip = (currentPage - 1) * limit;

        const result = await prompts.aggregate([
            {
                $match: query
            },

            {
                $lookup: {
                    from: "reviews",
                    let: {
                        promptId: { $toString: "$_id" }
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$promptId", "$$promptId"]
                                }
                            }
                        }
                    ],
                    as: "reviews"
                }
            },

            {
                $addFields: {
                    reviewCount: {
                        $size: "$reviews"
                    },
                    averageRating: {
                        $cond: [
                            { $gt: [{ $size: "$reviews" }, 0] },
                            { $avg: "$reviews.rating" },
                            0
                        ]
                    }
                }
            },

            {
                $project: {
                    title: 1,
                    description: 1,
                    thumbnail: 1,
                    category: 1,
                    aiTool: 1,
                    difficulty: 1,
                    visibility: 1,
                    copyCount: 1,
                    createdAt: 1,
                    status: 1,
                    reviewCount: 1,
                    averageRating: 1,
                    tags: 1,
                }
            },

            {
                $sort: sortOption
            },

            {
                $skip: skip
            },

            {
                $limit: limit
            }
        ]).toArray();

        res.status(200).send({
            success: true,
            data: {
                total,
                result
            }
        });

    } catch (error) {

        console.error("GET /api/prompts Error:", error);

        res.status(500).send({
            success: false,
            error: error.message
        });
    }
});

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

        const user = await users.findOne({
            email: req.user.email
        });

        console.log(prompt);
        console.log(user);


        if (user?.role === 'admin') {
            return res.status(200).send({
                success: true,
                message: 'Prompt fetched successfully by admin',
                data: prompt
            });
        }


        if (prompt?.visibility === 'free') {
            return res.status(200).send({
                success: true,
                message: 'Prompt fetched successfully',
                data: prompt
            });
        }


        if (user?.plan === 'premium') {
            return res.status(200).send({
                success: true,
                message: 'Prompt fetched successfully',
                data: prompt
            });
        }


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



app.get('/api/featured/prompts', async (req, res) => {
    try {

        let query = {
            status: 'approved',
            isFeatured: true,
        };


        let sortOption = { copyCount: -1 };

        const result = await prompts.aggregate([
            {

                $match: query
            },

            {

                $lookup: {
                    from: "reviews",
                    let: {
                        promptId: { $toString: "$_id" }
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$promptId", "$$promptId"]
                                }
                            }
                        }
                    ],
                    as: "reviews"
                }
            },

            {

                $addFields: {
                    reviewCount: {
                        $size: "$reviews"
                    },
                    averageRating: {
                        $cond: [
                            { $gt: [{ $size: "$reviews" }, 0] },
                            { $avg: "$reviews.rating" },
                            0
                        ]
                    }
                }
            },

            {

                $project: {
                    title: 1,
                    description: 1,
                    thumbnail: 1,
                    category: 1,
                    aiTool: 1,
                    difficulty: 1,
                    visibility: 1,
                    copyCount: 1,
                    createdAt: 1,
                    status: 1,

                    reviewCount: 1,
                    averageRating: 1
                }
            },

            {

                $sort: sortOption
            },

            {

                $limit: 6
            }
        ]).toArray();

        res.status(200).send({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {
        console.error("GET /api/featured-prompts Error:", error);

        res.status(500).send({
            success: false,
            error: error.message
        });
    }
});


app.get('/api/my/prompts', verifyToken, async (req, res) => {
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




app.get('/api/admin/prompts', verifyToken, verifyAdmin, async (req, res) => {
    try {


        let result;
        let total;

        if (req.query.page) {

            const pageNum = parseInt(req.query.page) || 1;
            const itemsPerPage = parseInt(req.query.itemsPerPage) || 8;
            const skipItem = (pageNum - 1) * itemsPerPage;

            total = await prompts.countDocuments();

            const cursor = prompts
                .find()
                .skip(skipItem)
                .limit(itemsPerPage);

            result = await cursor.toArray();

        } else {

            total = await prompts.countDocuments();

            const cursor = prompts.find();

            result = await cursor.toArray();
        }

        res.status(200).send({
            success: true,
            message: 'all prompts get successfully',
            data: {
                total,
                result
            }
        });

    } catch (error) {

        console.log(error);

        res.status(500).send({
            success: false,
            message: 'Failed get all prompts',
            error: error.message
        });
    }
});



// app.delete('/api/prompt/:id', async (req, res) => {

//     const { id } = req.params;

//     console.log(id);

//     const query = {
//         _id: new ObjectId(id)
//     }

//     try {

//         const deletePrompt = await prompts.deleteOne(query);

//         console.log(deletePrompt);

//         res.status(200).send({
//             success: true,
//             message: 'Delete prompt successfully',
//             data: deletePrompt
//         });

//     } catch (error) {

//         console.log(error);
//         res.status(500).send({
//             success: false,
//             message: 'Delete prompt failed',
//             error: error.message
//         });
//     }
// });


app.delete('/api/prompt/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // console.log("delete id", req.user.id);

        const prompt = await prompts.findOne({
            _id: new ObjectId(id)
        });



        if (!prompt) {
            return res.status(404).send({
                success: false,
                message: "Prompt not found"
            });
        }



        if (req.user.role !== "admin") {

            // User/Creator শুধু নিজের prompt delete করতে পারবে
            if (prompt.userId !== String(req.user._id)) {
                return res.status(403).send({
                    success: false,
                    message: "Forbidden access"
                });
            }
        }

        const result = await prompts.deleteOne({
            _id: new ObjectId(id)
        });

        res.status(200).send({
            success: true,
            message: "Delete prompt successfully",
            data: result
        });

    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Delete prompt failed",
            error: error.message
        });
    }
});





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


app.patch('/api/prompts/:id/copy', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;


        const result = await prompts.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { copyCount: 1 } }
        );

        if (result.modifiedCount > 0) {
            res.send({ success: true, message: "Copy count updated in database!" });
        } else {
            res.status(404).send({ success: false, message: "Prompt not found" });
        }
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
});




app.post('/api/bookmarks', async (req, res) => {
    try {
        const bookmark = req.body;


        const { userId, promptId } = bookmark;

        if (!userId || !promptId) {
            return res.status(400).send({
                success: false,
                message: 'userId and promptId are required'
            });
        }


        const existingBookmark = await bookmarks.findOne({ userId: userId, promptId: promptId });

        if (existingBookmark) {
            return res.status(400).send({
                success: false,
                alreadyBookmarked: true,
                message: 'You have already bookmarked this prompt.'
            });
        }


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

app.get('/api/bookmarks/check', async (req, res) => {
    const { userId, promptId } = req.query;
    const existing = await bookmarks.findOne({ userId, promptId });
    res.send({ isBookmarked: !!existing });
});

app.get('/api/reviews/check', async (req, res) => {
    try {
        const { userId, promptId } = req.query;

        const existing = await reviews.findOne({ userId, promptId });
        res.send({ hasReviewed: !!existing });
    } catch (error) {
        res.status(500).send({ hasReviewed: false });
    }
});

app.get('/api/reports/check', async (req, res) => {
    try {
        const { userId, promptId } = req.query;

        const existing = await reports.findOne({ userId, promptId });
        res.send({ hasReported: !!existing });
    } catch (error) {
        res.status(500).send({ hasReported: false });
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

app.delete('/api/bookmarks/:id', verifyToken, async (req, res) => {

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
app.post('/api/reviews', verifyToken, async (req, res) => {
    try {
        const review = req.body;


        const { userId, promptId } = review;

        if (!userId || !promptId) {
            return res.status(400).send({
                success: false,
                message: 'userId and promptId are required'
            });
        }


        const existingReview = await reviews.findOne({ userId: userId, promptId: promptId });

        if (existingReview) {
            return res.status(400).send({
                success: false,
                alreadyReviewed: true,
                message: 'You have already reviewed this prompt.'
            });
        }

        const reviewInfo = {
            ...review,
            createdAt: new Date().toLocaleString(),
        }

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

app.get('/api/my/reviews',verifyToken, async (req, res) => {
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





app.get('/api/reviews', async (req, res) => {
    try {

        const result = await reviews.find().limit(6).toArray()

        res.status(200).send({
            success: true,
            message: 'reviews get successfully',
            data: result
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  reviews ',
            error: error.message
        })
    }
});



app.get('/api/prompt/reviews', verifyToken, async (req, res) => {
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

app.patch('/api/admin/prompts/:id/status', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;


        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                success: false,
                error: "Invalid Prompt ID"
            });
        }

        const allowedStatuses = ['pending', 'approved', 'rejected'];
        if (!status || !allowedStatuses.includes(status.toLowerCase())) {
            return res.status(400).send({
                success: false,
                error: "Invalid status. Status must be pending, approved, or rejected."
            });
        }


        const query = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
                status: status.toLowerCase(),
                updatedAt: new Date()
            },
        };

        const result = await prompts.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
            return res.status(404).send({
                success: false,
                error: "Prompt not found"
            });
        }

        res.status(200).send({
            success: true,
            message: `Prompt status successfully updated to ${status}`,
            data: result
        });

    } catch (error) {
        console.error("Admin Status Update Error:", error);
        res.status(500).send({
            success: false,
            error: error.message
        });
    }
});

app.patch('/api/admin/prompts/:id/reject', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                success: false,
                error: "Invalid Prompt ID"
            });
        }

        const query = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
                status: 'rejected',
                rejectReason: reason || "Does not meet community guidelines",
                updatedAt: new Date()
            },
        };

        const result = await prompts.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
            return res.status(404).send({
                success: false,
                error: "Prompt not found"
            });
        }

        res.status(200).send({
            success: true,
            message: "Prompt has been rejected successfully",
            data: result
        });

    } catch (error) {
        console.error("Admin Reject Error:", error);
        res.status(500).send({
            success: false,
            error: error.message
        });
    }
});

app.patch('/api/admin/prompts/:id/featured', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isFeatured } = req.body; // বডি থেকে true অথবা false আসবে

        // ভ্যালিডেশন: বডিতে true/false পাঠানো হয়েছে কিনা চেক করা
        if (typeof isFeatured !== 'boolean') {
            return res.status(400).send({
                success: false,
                message: "isFeatured must be a boolean (true or false)"
            });
        }

        const query = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: { isFeatured: isFeatured }
        };

        const result = await prompts.updateOne(query, updateDoc);

        if (result.modifiedCount > 0) {
            res.status(200).send({
                success: true,
                message: `Prompt featured status updated to ${isFeatured} successfully!`,
                data: result
            });
        } else {
            res.status(404).send({
                success: false,
                message: "Prompt not found or no changes made"
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Failed to update featured status",
            error: error.message
        });
    }
});

app.get('/api/admin/analytics', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // ১. মোট ইউজারের সংখ্যা
        const totalUsers = await users.countDocuments();

        // ২. মোট প্রম্পটের সংখ্যা
        const totalPrompts = await prompts.countDocuments();

        // ৩. মোট রিভিউর সংখ্যা
        const totalReviews = await reviews.countDocuments();

        // ৪. মোট কপির সংখ্যা বের করার লজিক
        const copyResult = await prompts.aggregate([
            {
                $group: {
                    _id: null,
                    totalCopies: { $sum: "$copyCount" }
                }
            }
        ]).toArray();

        const totalCopies = copyResult.length > 0 ? copyResult[0].totalCopies : 0;

        // 📊 ৫. ১ম চার্ট: User Growth (মাসের নাম অনুযায়ী গ্রোথ ট্র্যাক)
        const allUsers = await users.find({}).toArray();
        const userMonthsObj = {};

        allUsers.forEach(user => {
            if (user.createdAt) {
                const date = new Date(user.createdAt);
                const monthName = date.toLocaleString('en-US', { month: 'short' });
                userMonthsObj[monthName] = (userMonthsObj[monthName] || 0) + 1;
            }
        });

        const userGrowthData = [];
        for (const month in userMonthsObj) {
            userGrowthData.push({
                name: month,
                users: userMonthsObj[month]
            });
        }

        // 📊 ৬. ২য় চার্ট: Top 5 Copied Prompts (সেরা ৫টি ও ছোট টাইটেল)
        const topPromptsRaw = await prompts.find({})
            .sort({ copyCount: -1 })
            .limit(5)
            .toArray();

        const topPromptsData = topPromptsRaw.map(p => {
            const originalTitle = p.title || "Untitled";
            const shortTitle = originalTitle.length > 12
                ? originalTitle.substring(0, 12) + '...'
                : originalTitle;
            return {
                name: shortTitle,
                copies: p.copyCount || 0
            };
        });

        // 🚀 রেসপন্স পাঠানো (আপনার আগের ডেটা ফরম্যাট একদম অক্ষত রেখে ভেতরে চার্টের ডেটা দেওয়া হলো)
        res.status(200).send({
            success: true,
            data: {
                totalUsers,
                totalPrompts,
                totalReviews,
                totalCopies,
                userGrowthData, // এক্সট্রা চার্ট ডেটা ১
                topPromptsData  // এক্সট্রা চার্ট ডেটা ২
            }
        });

    } catch (error) {
        console.error("Analytics API Error:", error);
        res.status(500).send({
            success: false,
            message: "Failed to fetch analytics data",
            error: error.message
        });
    }
});



// report related api
app.post('/api/reports', verifyToken, async (req, res) => {
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

app.get('/api/admin/reports', verifyToken, verifyAdmin, async (req, res) => {
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

app.delete('/api/admin/reports/:id', verifyToken, verifyAdmin, async (req, res) => {

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

app.post('/api/subscriptions', verifyToken, async (req, res) => {
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
                plan: subscription.planId,
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


app.get('/api/admin/subscriptions', verifyToken, verifyAdmin, async (req, res) => {
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




// creator related api
app.get('/api/top/creators', async (req, res) => {
    try {
        const result = await prompts.aggregate([

            { $match: { status: "approved" } },


            {
                $group: {
                    _id: "$userId",
                    totalPromptsCreated: { $sum: 1 },
                    totalCopies: { $sum: "$copyCount" }
                }
            },


            { $sort: { totalPromptsCreated: -1 } },


            { $limit: 10 },


            {
                $lookup: {
                    from: "user",
                    let: { creatorId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $eq: ["$_id", "$$creatorId"] },
                                        { $eq: ["$_id", { $toObjectId: "$$creatorId" }] },
                                        { $eq: [{ $toObjectId: "$_id" }, "$$creatorId"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "userDetails"
                }
            },


            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },


            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    totalPromptsCreated: 1,
                    totalCopies: 1,
                    userName: "$userDetails.name",
                    userImage: "$userDetails.userImage",
                    email: "$userDetails.email"
                }
            }
        ]).toArray();

        res.send({ success: true, data: result });
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
});

app.get('/api/analytics/:creatorId', verifyToken, async (req, res) => {
    try {
        const { creatorId } = req.params;

        if (!creatorId) {
            return res.status(400).send({
                success: false,
                error: "Creator ID is required"
            });
        }


        const userId = ObjectId.isValid(creatorId) ? new ObjectId(creatorId) : creatorId;


        const stats = await prompts.aggregate([
            {
                $match: {
                    $or: [
                        { creatorId: userId },
                        { userId: userId },
                        { "creatorId": creatorId },
                        { "userId": creatorId }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalPrompts: { $sum: 1 },
                    totalCopies: { $sum: { $ifNull: ["$copyCount", 0] } },
                    totalBookmarks: { $sum: { $ifNull: ["$bookmarks", 0] } }
                }
            }
        ]).toArray();


        const defaultStats = {
            totalPrompts: 0,
            totalCopies: 0,
            totalBookmarks: 0
        };

        const finalStats = stats[0] || defaultStats;


        const topCopiedPrompts = await prompts.find({
            $or: [
                { creatorId: userId },
                { userId: userId },
                { "creatorId": creatorId },
                { "userId": creatorId }
            ]
        })
            .sort({ copyCount: -1 })
            .limit(7)
            .toArray();


        const copiesChartData = [];
        for (let i = 0; i < topCopiedPrompts.length; i++) {
            const originalTitle = topCopiedPrompts[i].title || "Untitled";


            const shortTitle = originalTitle.length > 12
                ? originalTitle.substring(0, 12) + '...'
                : originalTitle;

            copiesChartData.push({
                name: shortTitle,
                copies: topCopiedPrompts[i].copyCount || 0
            });
        }



        const allMyPrompts = await prompts.find({
            $or: [
                { creatorId: userId },
                { userId: userId },
                { "creatorId": creatorId },
                { "userId": creatorId }
            ]
        }).toArray();


        const monthsObj = {};
        allMyPrompts.forEach(p => {
            if (p.createdAt) {
                const date = new Date(p.createdAt);
                const monthName = date.toLocaleString('en-US', { month: 'short' });

                if (monthsObj[monthName]) {
                    monthsObj[monthName] = monthsObj[monthName] + 1;
                } else {
                    monthsObj[monthName] = 1;
                }
            }
        });

        const growthChartData = [];
        for (const month in monthsObj) {
            growthChartData.push({
                month: month,
                prompts: monthsObj[month]
            });
        }



        res.status(200).send({
            success: true,
            data: {
                totalPrompts: finalStats.totalPrompts,
                totalCopies: finalStats.totalCopies,
                totalBookmarks: finalStats.totalBookmarks,
                copiesChartData: copiesChartData,
                growthChartData: growthChartData
            }
        });

    } catch (error) {
        console.error("Analytics API Error:", error);
        res.status(500).send({
            success: false,
            error: error.message
        });
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

