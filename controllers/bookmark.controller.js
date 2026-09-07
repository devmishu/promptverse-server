const { ObjectId } = require('mongodb');
const { bookmarks } = require('../config/db');

// Refactored from index.js. Existing business logic remains unchanged.

const addBookmark = async (req, res) => {
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
};

const checkBookmark = async (req, res) => {
    const { userId, promptId } = req.query;
    const existing = await bookmarks.findOne({ userId, promptId });
    res.send({ isBookmarked: !!existing });
};

const getMyBookmarks = async (req, res) => {
    try {
        const query = {};
        if (req.query.userId) {
            query.userId = req.query.userId;
        }

        const cursor = await bookmarks.find(query);
        const result = await cursor.toArray();

        res.status(200).send({
            success: true,
            message: 'my bookmarks get successfully',
            data: result
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  my bookmarks ',
            error: error.message
        });
    }
};

const deleteBookmark = async (req, res) => {
    const { id } = req.params;

    console.log(id);

    const query = {
        _id: new ObjectId(id)
    };

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
};

module.exports = {
    addBookmark,
    checkBookmark,
    getMyBookmarks,
    deleteBookmark
};
