// server/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewer: { // The user writing the review
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reviewee: { // The user being reviewed
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    exchange: { // Link to the specific exchange that prompted this review
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExchangeRequest', // Assuming ExchangeRequest model is named this
        required: true,
        unique: true, // A single exchange can only be reviewed once by the reviewer for the reviewee
    },
    rating: { // The rating (e.g., 1 to 5 stars)
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: { // The review text
        type: String,
        trim: true,
        maxlength: 500, // Optional: Limit comment length
    },
}, {
    timestamps: true, // Adds `createdAt` and `updatedAt`
});

// Add a compound unique index to ensure a user can only review another user for a specific exchange once
reviewSchema.index({ reviewer: 1, reviewee: 1, exchange: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;