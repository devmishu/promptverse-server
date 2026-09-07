const { ObjectId } = require('mongodb');
const { db, users, prompts, reviews, warnings, reports } = require('../config/db');

// Refactored from index.js. Existing business logic remains unchanged.

const getAnalytics = async (req, res) => {
    try {
        const totalUsers = await users.countDocuments();
        const totalPrompts = await prompts.countDocuments();
        const totalReviews = await reviews.countDocuments();

        const copyResult = await prompts.aggregate([
            {
                $group: {
                    _id: null,
                    totalCopies: { $sum: "$copyCount" }
                }
            }
        ]).toArray();

        const totalCopies = copyResult.length > 0 ? copyResult[0].totalCopies : 0;

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

        res.status(200).send({
            success: true,
            data: {
                totalUsers,
                totalPrompts,
                totalReviews,
                totalCopies,
                userGrowthData,
                topPromptsData
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
};

const warnCreator = async (req, res) => {
    try {
        const { reportId, creatorId, promptTitle } = req.body;

        if (!reportId || !creatorId) {
            return res.status(400).send({ success: false, message: "Missing parameters." });
        }

        await warnings.insertOne({
            userId: new ObjectId(creatorId),
            reportId: new ObjectId(reportId),
            promptTitle: promptTitle || 'Unspecified',
            message: `Your prompt "${promptTitle || 'Unspecified'}" was reported for violating community guidelines. Please review our policy.`,
            date: new Date(),
            isRead: false
        });

        await reports.deleteOne({ _id: new ObjectId(reportId) });

        res.status(200).send({
            success: true,
            message: "Warning issued successfully in separate collection and report cleared."
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Server error", error: error.message });
    }
};

const deleteReportedPrompt = async (req, res) => {
    try {
        const { reportId, promptId } = req.query;

        if (!reportId || !promptId) {
            return res.status(400).send({ success: false, message: "Missing reportId or promptId parameters." });
        }

        const [promptResult, reportResult] = await Promise.all([
            db.collection("prompts").deleteOne({ _id: new ObjectId(promptId) }),
            db.collection("reports").deleteOne({ _id: new ObjectId(reportId) })
        ]);

        res.status(200).send({
            success: true,
            message: "Prompt permanently removed and report cleared successfully."
        });

    } catch (error) {
        console.error("Delete Action Error:", error);
        res.status(500).send({ success: false, message: "Server error", error: error.message });
    }
};

module.exports = {
    getAnalytics,
    warnCreator,
    deleteReportedPrompt
};
