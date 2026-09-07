const { ObjectId } = require('mongodb');
const { prompts, users } = require('../config/db');

// Refactored from index.js. Existing business logic remains unchanged.

const addPrompt = async (req, res) => {
    try {
        const prompt = req.body;

        const promptInfo = {
            ...prompt,
            createdAt: new Date(),
        };
        const result = await prompts.insertOne(promptInfo);

        res.status(200).send({
            success: true,
            message: 'prompt added successfully',
            data: result
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed to add prompt ',
            error: error.message
        });
    }
};

const getPrompts = async (req, res) => {
    try {
        const {
            search,
            sort,
            aiTool,
            category,
            difficulty,
            page,
            itemsPerPage,
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

        if (sort === 'most-copied') {
            sortOption = { copyCount: -1 };
        } else if (sort === 'most-popular') {
            sortOption = { averageRating: -1 };
        }
        else if (sort === 'latest') {
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
};

const getPromptById = async (req, res) => {
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
};

const getFeaturedPrompts = async (req, res) => {
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
};

const getMyPrompts = async (req, res) => {
    try {
        const query = {};
        if (req.query.userId) {
            query.userId = req.query.userId;
        }

        const cursor = prompts.find(query);
        const result = await cursor.toArray();

        res.status(200).send({
            success: true,
            message: 'prompts get successfully',
            data: result
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  prompts ',
            error: error.message
        });
    }
};

const getAdminPrompts = async (req, res) => {
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
};

const deletePrompt = async (req, res) => {
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
};

const editPrompt = async (req, res) => {

    const data = req.body;
    const { id } = req.params;
    const query = {
        _id: new ObjectId(id)
    };
    const document = {
        $set: data
    };

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
};

const copyPrompt = async (req, res) => {
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
};

const updatePromptStatus = async (req, res) => {
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
};

const rejectPrompt = async (req, res) => {
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
};

const updatePromptFeatured = async (req, res) => {
    try {
        const { id } = req.params;
        const { isFeatured } = req.body;


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
};

module.exports = {
    addPrompt,
    getPrompts,
    getPromptById,
    getFeaturedPrompts,
    getMyPrompts,
    getAdminPrompts,
    deletePrompt,
    editPrompt,
    copyPrompt,
    updatePromptStatus,
    rejectPrompt,
    updatePromptFeatured
};
