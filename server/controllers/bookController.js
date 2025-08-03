// server/controllers/bookController.js
const Book = require('../models/Book');
const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinary'); // Import Cloudinary util

// @desc    Add a new book
// @route   POST /api/books
// @access  Private (Auth required)
const addBook = async (req, res) => {
    const { title, author, genre, isbn, condition, description } = req.body;
    let imageUrl = 'https://via.placeholder.com/150'; // Default placeholder

    if (!title || !author || !condition) {
        return res.status(400).json({ message: 'Please provide title, author, and condition.' });
    }

    try {
        if (req.file) { // If an image file was uploaded by the user
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: 'book-exchange-books', // Folder in your Cloudinary account
                resource_type: 'image',
            });
            imageUrl = result.secure_url; // Use the secure URL from Cloudinary
        }

        const newBook = new Book({
            owner: req.user._id,
            title,
            author,
            genre: genre || null,
            isbn: isbn || null,
            condition,
            description: description || null,
            imageUrl,
        });

        const createdBook = await newBook.save();
        res.status(201).json(createdBook);
    } catch (error) {
        console.error('Error adding book:', error);
        if (error.code === 11000 && error.keyPattern && error.keyPattern.isbn) {
            return res.status(400).json({ message: 'A book with this ISBN already exists.' });
        }
        res.status(500).json({ message: 'Server error: Could not add book.' });
    }
};

// @desc    Get all books (Available ones, can be filtered/searched later)
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
    try {
        const { keyword, genre, condition } = req.query;

        let query = { availabilityStatus: 'Available' };

        if (keyword) {
            const searchRegex = new RegExp(keyword, 'i');
            query.$or = [
                { title: searchRegex },
                { author: searchRegex },
                { description: searchRegex }
            ];
        }

        if (genre && genre !== 'All') {
            query.genre = genre;
        }

        if (condition && condition !== 'All') {
            query.condition = condition;
        }

        const books = await Book.find(query).populate('owner', 'username email');
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'Server error: Could not retrieve books.' });
    }
};

// @desc    Get a single book by ID
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('owner', 'username email');

        if (book) {
            res.json(book);
        } else {
            res.status(404).json({ message: 'Book not found.' });
        }
    } catch (error) {
        console.error('Error fetching single book:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid book ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not retrieve book.' });
    }
};

// @desc    Update a book (only by its owner)
// @route   PUT /api/books/:id
// @access  Private (Auth required)
const updateBook = async (req, res) => {
    const { title, author, genre, isbn, condition, description, availabilityStatus } = req.body;
    let imageUrlFromRequest = req.body.imageUrl;

    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ message: 'Book not found.' });
        }

        if (book.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this book.' });
        }

        let newImageUrl = book.imageUrl;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: 'book-exchange-books',
                resource_type: 'image',
            });
            newImageUrl = result.secure_url;
        } else if (imageUrlFromRequest !== undefined) {
            newImageUrl = imageUrlFromRequest === '' ? 'https://via.placeholder.com/150' : imageUrlFromRequest;
        }

        book.title = title !== undefined ? title : book.title;
        book.author = author !== undefined ? author : book.author;
        book.genre = genre !== undefined ? (genre || null) : book.genre;
        book.isbn = isbn !== undefined ? (isbn || null) : book.isbn;
        book.condition = condition !== undefined ? condition : book.condition;
        book.description = description !== undefined ? (description || null) : book.description;
        book.availabilityStatus = availabilityStatus !== undefined ? availabilityStatus : book.availabilityStatus;
        book.imageUrl = newImageUrl;

        const updatedBook = await book.save();
        res.json(updatedBook);
    } catch (error) {
        console.error('Error updating book:', error);
        if (error.code === 11000 && error.keyPattern && error.keyPattern.isbn) {
            return res.status(400).json({ message: 'A book with this ISBN already exists.' });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid book ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not update book.' });
    }
};

// @desc    Delete a book (only by its owner)
// @route   DELETE /api/books/:id
// @access  Private (Auth required)
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (book) {
            if (book.owner.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this book.' });
            }

            await book.deleteOne();
            res.json({ message: 'Book removed successfully.' });
        } else {
            res.status(404).json({ message: 'Book not found.' });
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid book ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not delete book.' });
    }
};

// @desc    Get all books listed by the logged-in user
// @route   GET /api/books/mybooks
// @access  Private (Auth required)
const getMyBooks = async (req, res) => {
    console.log('GET /api/books/mybooks hit!');
    console.log('User ID from token:', req.user ? req.user._id : 'User not found in req.user'); // Added check for req.user

    try {
        // Find books where the owner matches the logged-in user's ID
        const myBooks = await Book.find({ owner: req.user._id });
        console.log('Found myBooks:', myBooks.length);
        res.json(myBooks);
    } catch (error) {
        console.error('Error fetching my books:', error);
        res.status(500).json({ message: 'Server error: Could not retrieve your books.' });
    }
};

module.exports = {
    addBook,
    getBooks,
    getBookById,
    updateBook,
    deleteBook,
    getMyBooks,
};