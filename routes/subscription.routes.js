const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Refactored from index.js. Express routes definition.

router.post('/subscriptions', verifyToken, subscriptionController.createSubscription);
router.get('/admin/subscriptions', verifyToken, verifyAdmin, subscriptionController.getAdminSubscriptions);

module.exports = router;
