// server/models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId, // This links to the User model
        ref: 'User', // Reference to the 'User' collection
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    author: {
        type: String,
        required: true,
        trim: true,
    },
    genre: {
        type: String,
        trim: true,
        // You could make this an enum if you have predefined genres
        // enum: ['Fiction', 'Non-Fiction', 'Fantasy', 'Sci-Fi', 'Mystery', 'Thriller', 'Biography', 'History', 'Self-Help', 'Childrens', 'Education'],
    },
    isbn: {
        type: String,
        trim: true,
        unique: true, // ISBNs should be unique across all books
        sparse: true, // Allows multiple documents to have no ISBN, but enforces uniqueness if one is provided.
                      // Important if not all books will have an ISBN.
    },
    condition: {
        type: String,
        enum: ['New', 'Like New', 'Good', 'Fair', 'Worn'], // Restrict to specific values
        required: true,
    },
    description: {
        type: String,
        trim: true,
    },
    imageUrl: {
        type: String,
        trim: true,
        default: 'https://via.placeholder.com/150', // A default placeholder image
    },
    availabilityStatus: {
        type: String,
        enum: ['Available', 'Pending Exchange', 'Exchanged'], // Status of the book
        default: 'Available',
    },
}, {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
});

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;