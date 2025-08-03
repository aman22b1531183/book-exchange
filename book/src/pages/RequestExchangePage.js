// frontend/src/pages/RequestExchangePage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../components/Form.css'; // Import Form.css
import '../App.css'; // Import App.css for status-message
import './RequestExchange.css'; // Import RequestExchange.css

function RequestExchangePage() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [requestedBookId, setRequestedBookId] = useState('');
    const [requestedBookTitle, setRequestedBookTitle] = useState('');
    const [ownerId, setOwnerId] = useState('');

    const [myBooks, setMyBooks] = useState([]);
    const [offeredBookId, setOfferedBookId] = useState('');
    const [requestMessage, setRequestMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('requestedBookId');
        const title = queryParams.get('requestedBookTitle');
        const owner = queryParams.get('ownerId');

        if (id && title && owner) {
            setRequestedBookId(id);
            setRequestedBookTitle(decodeURIComponent(title));
            setOwnerId(owner);
        } else {
            toast.error('Missing book information for exchange request.');
            navigate('/books');
            return;
        }

        const fetchMyBooks = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get('/api/books/mybooks', config);
                setMyBooks(data.filter(book => book.availabilityStatus === 'Available'));
                setLoading(false);
            } catch (err) {
                console.error('Error fetching my books:', err);
                setError('Failed to load your books for offering.');
                toast.error('Failed to load your books.');
                setLoading(false);
            }
        };

        if (token) {
            fetchMyBooks();
        } else {
            setLoading(false);
            toast.warn('Please log in to proceed with the exchange request.');
            navigate('/login');
        }
    }, [location.search, navigate, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const requestData = {
                requestedBookId: requestedBookId,
                offeredBookId: offeredBookId || null,
                requestMessage: requestMessage,
            };
            await axios.post('/api/exchanges', requestData, config);
            toast.success('Exchange request sent successfully!');
            navigate('/exchanges');
        } catch (error) {
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Failed to send request: ${errorMessage}`);
            console.error('Error sending exchange request:', error);
        }
    };

    if (loading) {
        return <div className="status-message">Loading your books...</div>;
    }

    if (error) {
        return <div className="status-message error-message">Error: {error}</div>;
    }

    return (
        <div className="form-container"> /* Use .form-container */
            <h1 className="request-exchange-heading">Request Exchange for: "{requestedBookTitle}"</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="offeredBook">Offer your book (Optional):</label>
                    <select
                        id="offeredBook"
                        name="offeredBook"
                        value={offeredBookId}
                        onChange={(e) => setOfferedBookId(e.target.value)}
                        className="form-input form-select" /* Use .form-input .form-select */
                    >
                        <option value="">-- Select a book to offer --</option>
                        {myBooks.map((book) => (
                            <option key={book._id} value={book._id}>
                                {book.title} by {book.author} ({book.condition})
                            </option>
                        ))}
                    </select>
                    {myBooks.length === 0 && <p className="select-book-message">You don't have any available books to offer. <Link to="/books/add" className="text-link">Add one now!</Link></p>}
                </div>
                <div className="form-group">
                    <label htmlFor="requestMessage">Your Message:</label>
                    <textarea
                        id="requestMessage"
                        name="requestMessage"
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        rows="5"
                        placeholder="Tell the owner why you're interested in their book and suggest meetup/shipping details."
                        className="form-input form-textarea" /* Use .form-input .form-textarea */
                        required
                    ></textarea>
                </div>
                <button type="submit" className="form-button">Send Request</button> {/* Use .form-button */}
            </form>
        </div>
    );
}

export default RequestExchangePage;