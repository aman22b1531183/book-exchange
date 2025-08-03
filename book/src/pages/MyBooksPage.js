// frontend/src/pages/MyBooksPage.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom'; // Ensure Link is correctly imported
import './MyBooks.css'; // Import MyBooks.css
import './BookList.css'; // Import BookList.css for .book-card and its internal elements
import '../App.css'; // Import App.css for .page-heading, .status-message etc.

function MyBooksPage() {
    const { token } = useAuth();
    const [myBooks, setMyBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMyBooks = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const { data } = await axios.get('/api/books/mybooks', config);
            setMyBooks(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching my books:', err);
            setError('Failed to load your books. Please try again later.');
            toast.error('Failed to load your books.');
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchMyBooks();
    }, [fetchMyBooks]);

    const handleDelete = async (bookId) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };
                await axios.delete(`/api/books/${bookId}`, config);
                toast.success('Book deleted successfully!');
                fetchMyBooks();
            } catch (error) {
                const errorMessage = error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message;
                toast.error(`Failed to delete book: ${errorMessage}`);
                console.error('Error deleting book:', error);
            }
        }
    };

    // Helper function to return CSS class based on status
    const getStatusColorClass = (status) => {
        switch (status) {
            case 'Available': return 'status-available';
            case 'Pending Exchange': return 'status-pending-exchange';
            case 'Exchanged': return 'status-exchanged';
            default: return ''; // No specific class for unknown status
        }
    };

    if (loading) {
        return <div className="status-message">Loading your books...</div>;
    }

    if (error) {
        return <div className="status-message error-message">Error: {error}</div>;
    }

    return (
        <div className="my-books-page-container"> {/* <--- CRITICAL FIX: ADD THIS CLASS HERE */}
            <h1 className="page-heading">My Listed Books</h1>
            {myBooks.length === 0 ? (
                <p className="status-message info-message">You haven't listed any books yet. <Link to="/books/add" className="text-link">Add your first book!</Link></p>
            ) : (
                <div className="my-books-grid">
                    {myBooks.map((book) => (
                        <div key={book._id} className="book-card">
                            <img
                                src={book.imageUrl}
                                alt={book.title}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                            <div className="book-card-info">
                                <h3>{book.title}</h3>
                                <p><strong>Author:</strong> {book.author}</p>
                                <p><strong>Condition:</strong> <span className="condition-text">{book.condition}</span></p>
                                <p><strong>Status:</strong> <span className={`status-text ${getStatusColorClass(book.availabilityStatus)}`}>{book.availabilityStatus}</span></p>
                                <p className="book-card-description line-clamp-3">{book.description}</p>
                            </div>
                            <div className="my-book-card-actions">
                                {/* <Link to={`/my-books/edit/${book._id}`} className="edit-button">Edit</Link> */}
                                <button
                                    onClick={() => handleDelete(book._id)}
                                    className="delete-button"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyBooksPage;