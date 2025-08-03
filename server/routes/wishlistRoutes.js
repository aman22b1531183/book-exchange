// server/routes/wishlistRoutes.js
const express = require('express');
const {
    addWishlistItem,
    getMyWishlist,
    removeWishlistItem,
    getWishlistStatusForBook,
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, addWishlistItem); // Add to wishlist
router.get('/', protect, getMyWishlist); // Get user's wishlist
router.get('/status/:bookId', protect, getWishlistStatusForBook); // Check if a book is in wishlist
router.delete('/:id', protect, removeWishlistItem); // Remove from wishlist

module.exports = router;