const express = require('express');
const router = express.Router();
const promptController = require('../controllers/prompt.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Refactored from index.js. Express routes definition.

router.post('/prompts', verifyToken, promptController.addPrompt);
router.get('/prompts', promptController.getPrompts);
router.get('/prompts/:id', verifyToken, promptController.getPromptById);
router.get('/featured/prompts', promptController.getFeaturedPrompts);
router.get('/my/prompts', verifyToken, promptController.getMyPrompts);
router.get('/admin/prompts', verifyToken, verifyAdmin, promptController.getAdminPrompts);
router.delete('/prompt/:id', verifyToken, promptController.deletePrompt);
router.patch('/prompts/:id', promptController.editPrompt);
router.patch('/prompts/:id/copy', verifyToken, promptController.copyPrompt);
router.patch('/admin/prompts/:id/status', verifyToken, verifyAdmin, promptController.updatePromptStatus);
router.patch('/admin/prompts/:id/reject', verifyToken, verifyAdmin, promptController.rejectPrompt);
router.patch('/admin/prompts/:id/featured', verifyToken, verifyAdmin, promptController.updatePromptFeatured);

module.exports = router;
