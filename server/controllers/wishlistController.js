// server/controllers/wishlistController.js
const WishlistItem = require('../models/WishlistItem');
const Book = require('../models/Book'); // Might be needed for populating book details or validation
const User = require('../models/User'); // Might be needed for populating user details

// @desc    Add a book to the user's wishlist
// @route   POST /api/wishlist
// @access  Private
const addWishlistItem = async (req, res) => {
    const { bookId, title, author, notes } = req.body; // bookId for existing books, title/author for new
    const userId = req.user._id;

    if (!bookId && (!title || !author)) {
        return res.status(400).json({ message: 'Please provide either a bookId or a title and author.' });
    }

    try {
        let wishlistItemData = { user: userId, notes };

        if (bookId) {
            // If bookId is provided, verify it exists and is not already in the user's wishlist
            const bookExists = await Book.findById(bookId);
            if (!bookExists) {
                return res.status(404).json({ message: 'Book not found.' });
            }
            // Check if user already wishes for this specific book
            const existingSpecificWish = await WishlistItem.findOne({ user: userId, book: bookId });
            if (existingSpecificWish) {
                return res.status(400).json({ message: 'This book is already in your wishlist.' });
            }
            wishlistItemData.book = bookId;
            wishlistItemData.title = bookExists.title; // Pre-fill title/author from book if linked
            wishlistItemData.author = bookExists.author;
        } else {
            // If title/author are provided (and bookId is not), check for duplicate title/author wish
            const existingGenericWish = await WishlistItem.findOne({ user: userId, book: null, title: title, author: author });
            if (existingGenericWish) {
                return res.status(400).json({ message: 'You already wish for a book with this title and author.' });
            }
            wishlistItemData.title = title;
            wishlistItemData.author = author;
        }

        const newWishlistItem = await WishlistItem.create(wishlistItemData);
        // Populate the new item to send back full details if it's an existing book
        await newWishlistItem.populate('book', 'title author imageUrl');

        res.status(201).json(newWishlistItem);
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        // Handle potential duplicate key errors from the unique indexes
        if (error.code === 11000) {
             return res.status(400).json({ message: 'This item is already in your wishlist.' });
        }
        res.status(500).json({ message: 'Server error: Could not add item to wishlist.' });
    }
};

// @desc    Get all wishlist items for the logged-in user
// @route   GET /api/wishlist
// @access  Private
const getMyWishlist = async (req, res) => {
    try {
        const wishlistItems = await WishlistItem.find({ user: req.user._id })
            .populate('book', 'title author imageUrl condition availabilityStatus owner') // Populate linked book details
            .sort({ createdAt: -1 }); // Newest items first

        res.json(wishlistItems);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ message: 'Server error: Could not retrieve wishlist.' });
    }
};

// @desc    Remove a book from the user's wishlist
// @route   DELETE /api/wishlist/:id
// @access  Private
const removeWishlistItem = async (req, res) => {
    try {
        const wishlistItem = await WishlistItem.findById(req.params.id);

        if (!wishlistItem) {
            return res.status(404).json({ message: 'Wishlist item not found.' });
        }

        // Ensure the logged-in user owns this wishlist item
        if (wishlistItem.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to remove this wishlist item.' });
        }

        await wishlistItem.deleteOne();
        res.json({ message: 'Wishlist item removed successfully.' });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid wishlist item ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not remove item from wishlist.' });
    }
};

// @desc    Check if a specific book is in the user's wishlist
// @route   GET /api/wishlist/status/:bookId
// @access  Private
const getWishlistStatusForBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user._id;

        const wishlistItem = await WishlistItem.findOne({ user: userId, book: bookId });

        res.json({ isInWishlist: !!wishlistItem, wishlistItemId: wishlistItem ? wishlistItem._id : null });
    } catch (error) {
        console.error('Error fetching wishlist status for book:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid book ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not retrieve wishlist status.' });
    }
};


module.exports = {
    addWishlistItem,
    getMyWishlist,
    removeWishlistItem,
    getWishlistStatusForBook,
};