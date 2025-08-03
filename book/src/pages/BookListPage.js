// frontend/src/pages/BookListPage.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import placeholderImage from '../assests/placeholder.png'; // Make sure this path is correct
import './BookList.css'; // General styling for book list/cards
import '../App.css'; // For page-heading, status-message
import  useDebounce  from '../hooks/useDebounce'; // Assuming you have a useDebounce hook

function BookListPage() {
    const { user, isAuthenticated, token } = useAuth();
    const navigate = useNavigate();

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [genreFilter, setGenreFilter] = useState('All');
    const [conditionFilter, setConditionFilter] = useState('All');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [wishlistStatus, setWishlistStatus] = useState({});

    const fetchBooks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {};
            if (debouncedSearchTerm) {
                params.keyword = debouncedSearchTerm;
            }
            if (genreFilter !== 'All') {
                params.genre = genreFilter;
            }
            if (conditionFilter !== 'All') {
                params.condition = conditionFilter;
            }

            const { data } = await axios.get('/api/books', { params });
            setBooks(data);
            setLoading(false);

            if (isAuthenticated && token && user) {
                const statusPromises = data.map(book =>
                    axios.get(`/api/wishlist/status/${book._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).then(res => ({ bookId: book._id, ...res.data }))
                );
                const statuses = await Promise.all(statusPromises);
                const newWishlistStatus = {};
                statuses.forEach(status => {
                    newWishlistStatus[status.bookId] = {
                        isInWishlist: status.isInWishlist,
                        wishlistItemId: status.wishlistItemId
                    };
                });
                setWishlistStatus(newWishlistStatus);
            } else {
                setWishlistStatus({});
            }

        } catch (err) {
            console.error('Error fetching books:', err);
            setError('Failed to load books. Please try again later.');
            toast.error('Failed to load books.');
            setLoading(false);
        }
    }, [debouncedSearchTerm, genreFilter, conditionFilter, isAuthenticated, token, user]);

    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    const handleRequestExchange = (requestedBookId, ownerId, requestedBookTitle) => {
        if (!isAuthenticated) {
            toast.warn('Please log in to request an exchange.');
            navigate('/login');
            return;
        }
        if (user._id === ownerId) {
            toast.info('You cannot request an exchange for your own book.');
            return;
        }
        navigate(`/request-exchange?requestedBookId=${requestedBookId}&ownerId=${ownerId}&requestedBookTitle=${encodeURIComponent(requestedBookTitle)}`);
    };

    const handleToggleWishlist = async (bookId) => {
        if (!isAuthenticated) {
            toast.warn('Please log in to manage your wishlist.');
            navigate('/login');
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const currentStatus = wishlistStatus[bookId];

            if (currentStatus && currentStatus.isInWishlist) {
                await axios.delete(`/api/wishlist/${currentStatus.wishlistItemId}`, config);
                toast.info('Removed from wishlist!');
                setWishlistStatus(prev => ({ ...prev, [bookId]: { isInWishlist: false, wishlistItemId: null } }));
            } else {
                await axios.post('/api/wishlist', { bookId: bookId }, config);
                toast.success('Added to wishlist!');
                const { data } = await axios.get(`/api/wishlist/status/${bookId}`, config);
                setWishlistStatus(prev => ({ ...prev, [bookId]: { isInWishlist: data.isInWishlist, wishlistItemId: data.wishlistItemId } }));
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Wishlist update failed: ${errorMessage}`);
        }
    };

    const availableGenres = ['All', 'Fiction', 'Non-Fiction', 'Fantasy', 'Sci-Fi', 'Mystery', 'Thriller', 'Biography', 'History', 'Self-Help', 'Childrens', 'Education'];
    const availableConditions = ['All', 'New', 'Like New', 'Good', 'Fair', 'Worn'];

    if (loading) {
        return <div className="status-message">Loading books...</div>;
    }

    if (error) {
        return <div className="status-message error-message">Error: {error}</div>;
    }

    return (
        <div className="browse-books-page-container"> {/* <--- NEW: Overall container for the page */}
            <h1 className="page-heading">Available Books</h1>

            {/* Filter Section */}
            <div className="filter-section">
                <input
                    type="text"
                    placeholder="Search by title, author, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="filter-select">
                    {availableGenres.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                    ))}
                </select>
                <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="filter-select">
                    {availableConditions.map(condition => (
                        <option key={condition} value={condition}>{condition}</option>
                    ))}
                </select>
            </div>

            {books.length === 0 ? (
                <p className="status-message no-books">No books match your criteria. Try adjusting your search/filters!</p>
            ) : (
                <div className="book-grid">
                    {books.map((book) => (
                        <div key={book._id} className="book-card">
                            <img
                                src={book.imageUrl}
                                alt={book.title}
                                className="book-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                            />
                            <div className="book-info">
                                <h3 className="book-title">{book.title}</h3>
                                <p className="book-author">by {book.author}</p>
                                <p className="book-meta"><strong>Genre:</strong> {book.genre || 'N/A'}</p>
                                <p className="book-meta"><strong>Condition:</strong> <span className={`book-condition-${book.condition.toLowerCase().replace(' ', '-')}`}>{book.condition}</span></p>
                                <p className="book-owner"><strong>Owner:</strong> <span className="owner-username">{book.owner ? book.owner.username : 'Unknown'}</span></p>
                                <p className="book-description">{book.description}</p>
                            </div>
                            <div className="book-actions">
                                {isAuthenticated && user && book.owner && user._id !== book.owner._id && (
                                    <button
                                        onClick={() => handleRequestExchange(book._id, book.owner._id, book.title)}
                                        className="btn btn-primary"
                                    >
                                        Request Exchange
                                    </button>
                                )}
                                {isAuthenticated && user && (
                                    <button
                                        onClick={() => handleToggleWishlist(book._id)}
                                        className={`btn ${wishlistStatus[book._id]?.isInWishlist ? 'btn-secondary' : 'btn-outline-primary'}`}
                                    >
                                        {wishlistStatus[book._id]?.isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default BookListPage;