const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creator.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Refactored from index.js. Express routes definition.

router.get('/top/creators', creatorController.getTopCreators);
router.get('/analytics/:creatorId', verifyToken, creatorController.getCreatorAnalytics);
router.get('/creator/warnings', verifyToken, creatorController.getCreatorWarnings);

module.exports = router;
