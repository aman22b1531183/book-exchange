// server/models/WishlistItem.js
const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
    user: { // The user who owns this wishlist item
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    book: { // Reference to an existing Book (optional if they wish for a book not yet listed)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        default: null, // Can be null if the book is not in the system yet or identified by title/author
    },
    title: { // Title of the wished book (required if 'book' is null)
        type: String,
        trim: true,
        required: function() { return !this.book; } // Required only if 'book' field is not provided
    },
    author: { // Author of the wished book (required if 'book' is null)
        type: String,
        trim: true,
        required: function() { return !this.book; } // Required only if 'book' field is not provided
    },
    notes: { // Optional: user's personal notes about this wishlist item
        type: String,
        trim: true,
        maxlength: 500,
    },
    // You could add fields like `priority` (High, Medium, Low) or `desiredCondition`
}, {
    timestamps: true, // Adds `createdAt` and `updatedAt`
});

// Add a compound unique index to prevent duplicate entries for a user's wishlist
// A user can only wish for a specific book (by ID) once OR a specific title/author combo once.
wishlistItemSchema.index(
    { user: 1, book: 1 }, // For specific books
    { unique: true, partialFilterExpression: { book: { $exists: true, $ne: null } } } // Only unique if 'book' field exists
);
wishlistItemSchema.index(
    { user: 1, title: 1, author: 1 }, // For books specified by title/author
    { unique: true, partialFilterExpression: { book: null } } // Only unique if 'book' field is null
);


const WishlistItem = mongoose.model('WishlistItem', wishlistItemSchema);
module.exports = WishlistItem;