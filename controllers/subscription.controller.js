const { subscriptions, users } = require('../config/db');

// Refactored from index.js. Existing business logic remains unchanged.

const createSubscription = async (req, res) => {
    try {
        const subscription = req.body;
        console.log("planId:,,", subscription.planId);

        const subsInfo = {
            ...subscription,
            createdAt: new Date(),
        };

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
};

const getAdminSubscriptions = async (req, res) => {
    try {
        const result = await subscriptions.find().toArray();

        res.status(200).send({
            success: true,
            message: 'all subscriptions get successfully',
            data: result
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Failed get  all subscriptions ',
            error: error.message
        });
    }
};

module.exports = {
    createSubscription,
    getAdminSubscriptions
};
