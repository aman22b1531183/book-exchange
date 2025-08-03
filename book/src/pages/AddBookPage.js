// frontend/src/pages/AddBookPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// import BookIcon from '../assests/book-icon.svg'; // If you have a local icon
import './AddBook.css'; // <--- NEW IMPORT: Link to new CSS for this page
import '../App.css'; // For general styles like page-heading

function AddBookPage() {
    const { token } = useAuth(); // Get the token from AuthContext
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        genre: '',
        isbn: '',
        condition: 'Good', // Default value
        description: '',
    });
    const [imageFile, setImageFile] = useState(null); // State for the image file itself
    const [submitting, setSubmitting] = useState(false); // For button loading state

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]); // Get the selected file
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        // Create FormData object for sending files
        const dataToSend = new FormData();
        for (const key in formData) {
            dataToSend.append(key, formData[key]);
        }
        if (imageFile) {
            dataToSend.append('image', imageFile); // 'image' is the field name expected by Multer
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data', // Crucial for sending files
                    Authorization: `Bearer ${token}`, // Include the JWT token
                },
            };
            await axios.post('/api/books', dataToSend, config);
            toast.success('Book added successfully!');
            navigate('/my-books'); // Redirect to user's own books page
        } catch (error) {
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Failed to add book: ${errorMessage}`);
            console.error('Error adding book:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="add-book-page-container"> {/* <--- NEW: Overall container for the page */}
            <div className="add-book-form-wrapper"> {/* <--- NEW: Wrapper for the form content */}
                <div className="add-book-header-content">
                    <i className="fas fa-book-medical add-book-icon"></i> {/* Font Awesome Icon */}
                    <h1 className="add-book-welcome-heading">Add a New Book</h1>
                    <p className="add-book-description">
                        Share your literary treasures with the community!
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="add-book-form"> {/* <--- NEW: Specific form class */}
                    <div className="form-group">
                        <label htmlFor="title">Title:</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="form-input" // Reusing form-input
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="author">Author:</label>
                        <input
                            type="text"
                            id="author"
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="genre">Genre:</label>
                        <input
                            type="text"
                            id="genre"
                            name="genre"
                            value={formData.genre}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="isbn">ISBN (Optional):</label>
                        <input
                            type="text"
                            id="isbn"
                            name="isbn"
                            value={formData.isbn}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="condition">Condition:</label>
                        <select
                            id="condition"
                            name="condition"
                            value={formData.condition}
                            onChange={handleChange}
                            required
                            className="form-input form-select" // Reusing form-select
                        >
                            <option value="New">New</option>
                            <option value="Like New">Like New</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Worn">Worn</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            className="form-input form-textarea" // Reusing form-textarea
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="imageFile">Upload Book Cover (Optional):</label>
                        <input
                            type="file"
                            id="imageFile"
                            name="imageFile"
                            onChange={handleFileChange}
                            accept="image/*"
                            className="form-input form-file-input" // New class for file input specific styling
                        />
                    </div>
                    <button type="submit" className="form-submit-button" disabled={submitting}> {/* Reusing form-submit-button */}
                        {submitting ? 'Adding Book...' : 'Add Book'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AddBookPage;