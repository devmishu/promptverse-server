const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmark.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Refactored from index.js. Express routes definition.

router.post('/bookmarks', verifyToken, bookmarkController.addBookmark);
router.get('/bookmarks/check', bookmarkController.checkBookmark);
router.get('/my/bookmarks', verifyToken, bookmarkController.getMyBookmarks);
router.delete('/bookmarks/:id', verifyToken, bookmarkController.deleteBookmark);

module.exports = router;
