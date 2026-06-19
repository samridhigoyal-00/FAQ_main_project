// backend/routes/faq.js
const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { isAuth, isAdmin } = require('../middlewares/authMiddleware');
const { validateMessageLength } = require('../middlewares/validate');

// === PUBLIC ROUTES ===
router.get('/', faqController.getFaqs);
router.get('/search-suggest', faqController.getSearchSuggestions);
router.post('/:id/view', faqController.incrementView);

// === STUDENT/USER ROUTES ===
router.post('/check-duplicate', isAuth, faqController.checkDuplicate);
router.get('/my-submissions', isAuth, faqController.getUserSubmissions);
router.post('/add', isAuth, faqController.addFaq);
router.get('/stats', isAuth, faqController.getStats);
router.post('/chat', isAuth, validateMessageLength, faqController.chatWithAI);
router.get('/chat/usage', isAuth, faqController.getChatUsage);
router.post('/:id/report', isAuth, faqController.reportFaq);
router.post('/:id/upvote', isAuth, faqController.upvoteFaq);

// === ADMIN ROUTES ===
router.get('/admin/analytics', isAuth, isAdmin, faqController.getAdminAnalytics);
router.get('/admin/all', isAuth, isAdmin, faqController.getAllFaqsForAdmin);
router.post('/:id/approve', isAuth, isAdmin, faqController.approveFaq);
router.post('/:id/reject', isAuth, isAdmin, faqController.rejectFaq);
router.put('/:id', isAuth, isAdmin, faqController.editFaq);
router.delete('/:id', isAuth, isAdmin, faqController.deleteFaq);

module.exports = router;