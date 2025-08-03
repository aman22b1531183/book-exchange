// server/routes/reviewRoutes.js
const express = require('express');
const {
    addReview,
    getUserReviews,
    getExchangeReviewStatus,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, addReview); // Add a new review
router.get('/user/:userId', getUserReviews); // Get all reviews for a specific user (public)
router.get('/exchange-status/:exchangeId', protect, getExchangeReviewStatus); // Get review status for an exchange

module.exports = router;