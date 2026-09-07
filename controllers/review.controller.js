const { reviews } = require('../config/db');

// Refactored from index.js. Existing business logic remains unchanged.

const checkReview = async (req, res) => {
    try {
        const { userId, promptId } = req.query;

        const existing = await reviews.findOne({ userId, promptId });
        res.send({ hasReviewed: !!existing });
    } catch (error) {
        res.status(500).send({ hasReviewed: false });
    }
};

const addReview = async (req, res) => {
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
        };

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
};

const getMyReviews = async (req, res) => {
    try {
        const query = {};
        if (req.query.userId) {
            query.userId = req.query.userId;
        }

        const cursor = await reviews.find(query);
        const result = await cursor.toArray();

        res.status(200).send({
            success: true,
            message: 'my reviews get successfully',
            data: result
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  my reviews ',
            error: error.message
        });
    }
};

const getReviews = async (req, res) => {
    try {
        const result = await reviews.find().limit(6).toArray();

        res.status(200).send({
            success: true,
            message: 'reviews get successfully',
            data: result
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  reviews ',
            error: error.message
        });
    }
};

const getPromptReviews = async (req, res) => {
    try {
        const query = {};
        if (req.query.promptId) {
            query.promptId = req.query.promptId;
        }

        const cursor = await reviews.find(query);
        const result = await cursor.toArray();

        res.status(200).send({
            success: true,
            message: 'Prompt reviews get successfully',
            data: result
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  Prompt reviews ',
            error: error.message
        });
    }
};

module.exports = {
    checkReview,
    addReview,
    getMyReviews,
    getReviews,
    getPromptReviews
};
