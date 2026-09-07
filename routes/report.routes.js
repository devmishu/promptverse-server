const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Refactored from index.js. Express routes definition.

router.get('/reports/check', reportController.checkReport);
router.post('/reports', verifyToken, reportController.addReport);
router.get('/admin/reports', verifyToken, verifyAdmin, reportController.getAdminReports);
router.delete('/admin/reports/:id', verifyToken, verifyAdmin, reportController.deleteAdminReport);

module.exports = router;
