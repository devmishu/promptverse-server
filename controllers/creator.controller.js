const { ObjectId } = require('mongodb');
const { db, prompts, warnings } = require('../config/db');

// Refactored from index.js. Existing business logic remains unchanged.

const getTopCreators = async (req, res) => {
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
        ]).limit(3).toArray();

        res.send({ success: true, data: result });
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
};

const getCreatorAnalytics = async (req, res) => {
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
};

const getCreatorWarnings = async (req, res) => {
    try {
        const userId = req.user._id;

        const creatorWarnings = await db.collection("warnings")
            .find({ userId: new ObjectId(userId) })
            .sort({ date: -1 })
            .toArray();

        res.status(200).send({ success: true, data: creatorWarnings });
    } catch (error) {
        res.status(500).send({ success: false, message: "Failed to fetch warnings" });
    }
};

module.exports = {
    getTopCreators,
    getCreatorAnalytics,
    getCreatorWarnings
};
