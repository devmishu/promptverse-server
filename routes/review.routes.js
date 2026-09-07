const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Refactored from index.js. Express routes definition.

router.get('/reviews/check', reviewController.checkReview);
router.post('/reviews', verifyToken, reviewController.addReview);
router.get('/my/reviews', verifyToken, reviewController.getMyReviews);
router.get('/reviews', reviewController.getReviews);
router.get('/prompt/reviews', verifyToken, reviewController.getPromptReviews);

module.exports = router;
