const { ObjectId } = require('mongodb');
const { reports } = require('../config/db');

// Refactored from index.js. Existing business logic remains unchanged.

const checkReport = async (req, res) => {
    try {
        const { userId, promptId } = req.query;

        const existing = await reports.findOne({ userId, promptId });
        res.send({ hasReported: !!existing });
    } catch (error) {
        res.status(500).send({ hasReported: false });
    }
};

const addReport = async (req, res) => {
    try {
        const report = req.body;

        const { userId, promptId } = report;

        if (!userId || !promptId) {
            return res.status(400).send({
                success: false,
                message: 'userId and promptId are required'
            });
        }

        const existingReport = await reports.findOne({ userId: userId, promptId: promptId });

        if (existingReport) {
            return res.status(400).send({
                success: false,
                alreadyReported: true,
                message: 'You have already reported this prompt.'
            });
        }

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
};

const getAdminReports = async (req, res) => {
    try {
        const result = await reports.find().toArray();

        res.status(200).send({
            success: true,
            message: 'all reports get successfully',
            data: result
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  all reports ',
            error: error.message
        });
    }
};

const deleteAdminReport = async (req, res) => {
    const { id } = req.params;

    console.log(id);

    const query = {
        _id: new ObjectId(id)
    };

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
};

module.exports = {
    checkReport,
    addReport,
    getAdminReports,
    deleteAdminReport
};
