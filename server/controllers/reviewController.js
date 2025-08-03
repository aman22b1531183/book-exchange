// server/controllers/reviewController.js
const Review = require('../models/Review');
const ExchangeRequest = require('../models/ExchangeRequest'); // Needed to verify exchange status
const User = require('../models/User'); // Needed to ensure reviewee exists

// Helper to calculate average rating (optional, can be done on frontend or pre-calculated)
const calculateAverageRating = async (userId) => {
    const stats = await Review.aggregate([
        { $match: { reviewee: userId } },
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                numReviews: { $sum: 1 },
            },
        },
    ]);
    // You could update the User model with these stats here if you want
    // await User.findByIdAndUpdate(userId, { averageRating: stats[0]?.avgRating || 0, numReviews: stats[0]?.numReviews || 0 });
    return stats[0] || { avgRating: 0, numReviews: 0 };
};

// @desc    Add a review for another user after a completed exchange
// @route   POST /api/reviews
// @access  Private
const addReview = async (req, res) => {
    const { revieweeId, exchangeId, rating, comment } = req.body;
    const reviewerId = req.user._id; // The logged-in user is the reviewer

    // Basic validation
    if (!revieweeId || !exchangeId || !rating) {
        return res.status(400).json({ message: 'Please provide reviewee, exchange ID, and rating.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }
    if (reviewerId.toString() === revieweeId.toString()) {
        return res.status(400).json({ message: 'You cannot review yourself.' });
    }

    try {
        // 1. Verify the exchange exists and is completed
        const exchange = await ExchangeRequest.findById(exchangeId)
            .populate('requester')
            .populate('owner');

        if (!exchange) {
            return res.status(404).json({ message: 'Exchange not found.' });
        }
        if (exchange.status !== 'Completed') {
            return res.status(400).json({ message: 'Review can only be added for a completed exchange.' });
        }

        // 2. Ensure the reviewer is one of the parties in the exchange
        const isReviewerInvolved = (exchange.requester._id.toString() === reviewerId.toString() ||
                                    exchange.owner._id.toString() === reviewerId.toString());
        if (!isReviewerInvolved) {
            return res.status(403).json({ message: 'You are not involved in this exchange.' });
        }

        // 3. Ensure the reviewee is the OTHER party in the exchange
        let actualRevieweeId;
        if (exchange.requester._id.toString() === reviewerId.toString()) {
            actualRevieweeId = exchange.owner._id; // If reviewer is requester, reviewee must be owner
        } else if (exchange.owner._id.toString() === reviewerId.toString()) {
            actualRevieweeId = exchange.requester._id; // If reviewer is owner, reviewee must be requester
        } else {
             return res.status(400).json({ message: 'Invalid reviewee for this exchange.' });
        }

        if (actualRevieweeId.toString() !== revieweeId.toString()) {
            return res.status(400).json({ message: 'The reviewee specified is not the other party in this exchange.' });
        }

        // 4. Check if a review already exists for this exchange by this reviewer for this reviewee
        const existingReview = await Review.findOne({
            reviewer: reviewerId,
            reviewee: revieweeId,
            exchange: exchangeId,
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this exchange with this user.' });
        }

        // 5. Create the new review
        const newReview = new Review({
            reviewer: reviewerId,
            reviewee: revieweeId,
            exchange: exchangeId,
            rating,
            comment,
        });

        const createdReview = await newReview.save();

        // Optional: Recalculate and update the reviewee's average rating in their User profile
        await calculateAverageRating(revieweeId);

        res.status(201).json(createdReview);

    } catch (error) {
        console.error('Error adding review:', error);
        // Handle duplicate key error if compound index fails (unlikely given logic, but good practice)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this exchange with this user.' });
        }
        res.status(500).json({ message: 'Server error: Could not add review.' });
    }
};

// @desc    Get all reviews for a specific user (the reviewee)
// @route   GET /api/reviews/user/:userId
// @access  Public (can be viewed by anyone)
const getUserReviews = async (req, res) => {
    try {
        const userId = req.params.userId;
        const reviews = await Review.find({ reviewee: userId })
            .populate('reviewer', 'username profilePictureUrl') // Show who wrote the review
            .populate('exchange', 'requestedBook offeredBook') // Show context of the exchange
            .sort({ createdAt: -1 }); // Newest reviews first

        // Optionally, return average rating along with reviews
        const { avgRating, numReviews } = await calculateAverageRating(userId);

        res.json({ reviews, averageRating: avgRating, numReviews });
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not retrieve reviews.' });
    }
};

// @desc    Get review status for a specific exchange for the logged-in user
// @route   GET /api/reviews/exchange-status/:exchangeId
// @access  Private
const getExchangeReviewStatus = async (req, res) => {
    try {
        const { exchangeId } = req.params;
        const userId = req.user._id;

        const exchange = await ExchangeRequest.findById(exchangeId)
            .populate('requester')
            .populate('owner');

        if (!exchange) {
            return res.status(404).json({ message: 'Exchange not found.' });
        }

        // Determine if the logged-in user is one of the parties in this completed exchange
        const isRequester = exchange.requester._id.toString() === userId.toString();
        const isOwner = exchange.owner._id.toString() === userId.toString();

        if (!isRequester && !isOwner) {
            return res.status(403).json({ message: 'Not authorized to view review status for this exchange.' });
        }
        if (exchange.status !== 'Completed') {
            return res.status(200).json({ canReview: false, message: 'Exchange not completed yet.' });
        }

        let revieweeId = null;
        if (isRequester) { // If logged-in user is requester, they review the owner
            revieweeId = exchange.owner._id;
        } else if (isOwner) { // If logged-in user is owner, they review the requester
            revieweeId = exchange.requester._id;
        }

        const existingReview = await Review.findOne({
            reviewer: userId,
            reviewee: revieweeId,
            exchange: exchangeId,
        });

        res.json({
            canReview: !existingReview && (isRequester || isOwner),
            hasReviewed: !!existingReview,
            otherPartyId: revieweeId,
            otherPartyUsername: revieweeId ? (isRequester ? exchange.owner.username : exchange.requester.username) : null,
            message: existingReview ? 'You have already reviewed this exchange.' : 'Ready to review this exchange.'
        });

    } catch (error) {
        console.error('Error fetching exchange review status:', error);
         if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not retrieve review status.' });
    }
};


module.exports = {
    addReview,
    getUserReviews,
    getExchangeReviewStatus, // Export new function
};