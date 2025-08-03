// server/routes/bookRoutes.js
const express = require('express');
const {
    addBook,
    getBooks,
    getBookById,
    updateBook,
    deleteBook,
    getMyBooks,
} = require('../controllers/bookController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Import the new upload middleware

const router = express.Router();

// Private routes (authentication required)
// Use upload.single('image') for a single file upload, where 'image' is the name of the file input field in your form
router.post('/', protect, upload.single('image'), addBook); // Add upload middleware
router.put('/:id', protect, upload.single('image'), updateBook); // Add upload middleware

// Other protected routes
router.get('/mybooks', protect, getMyBooks);
router.delete('/:id', protect, deleteBook);


// Public routes (no authentication needed to browse)
router.get('/', getBooks);
router.get('/:id', getBookById);

module.exports = router;