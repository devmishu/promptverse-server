const express = require('express');
const router = express.Router();

const promptRoutes = require('./prompt.routes');
const bookmarkRoutes = require('./bookmark.routes');
const reviewRoutes = require('./review.routes');
const reportRoutes = require('./report.routes');
const adminRoutes = require('./admin.routes');
const subscriptionRoutes = require('./subscription.routes');
const creatorRoutes = require('./creator.routes');

// Mount feature routers under central router
router.use('/', promptRoutes);
router.use('/', bookmarkRoutes);
router.use('/', reviewRoutes);
router.use('/', reportRoutes);
router.use('/', adminRoutes);
router.use('/', subscriptionRoutes);
router.use('/', creatorRoutes);

module.exports = router;
