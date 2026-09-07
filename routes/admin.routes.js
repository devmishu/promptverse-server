const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Refactored from index.js. Express routes definition.

router.get('/admin/analytics', verifyToken, verifyAdmin, adminController.getAnalytics);
router.post('/admin/warn-creator', verifyToken, verifyAdmin, adminController.warnCreator);
router.delete('/admin/delete-reported-prompt', verifyToken, verifyAdmin, adminController.deleteReportedPrompt);

module.exports = router;
