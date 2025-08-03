// frontend/src/pages/ExchangeDetailsPage.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ReviewForm from '../components/ReviewForm'; // <--- NEW IMPORT
import '../pages/ExchangeDetails.css'; // Assuming you have general Exchange Details styling
import '../App.css'; // For page-heading, status-message

function ExchangeDetailsPage() {
    const { id: exchangeRequestId } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [exchange, setExchange] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessageContent, setNewMessageContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviewStatus, setReviewStatus] = useState(null); // <--- NEW STATE for review status
    const [showReviewForm, setShowReviewForm] = useState(false); // <--- NEW STATE to toggle review form

    const messagesEndRef = useRef(null);

    const fetchExchangeDetails = useCallback(async () => {
        if (!token || !exchangeRequestId) return;
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`/api/exchanges/${exchangeRequestId}`, config);
            setExchange(data);
            setLoading(false);
            // Fetch review status immediately after exchange details are loaded
            if (data.status === 'Completed') {
                await fetchReviewStatus(data._id);
            }
        } catch (err) {
            console.error('Error fetching exchange details:', err);
            const errorMessage = err.response && err.response.data.message
                ? err.response.data.message
                : err.message;
            setError(`Failed to load exchange details: ${errorMessage}`);
            toast.error(`Failed to load exchange details: ${errorMessage}`);
            setLoading(false);
            if (err.response && (err.response.status === 403 || err.response.status === 404)) {
                navigate('/exchanges'); // Redirect if not authorized or not found
            }
        }
    }, [exchangeRequestId, token, navigate]);

    const fetchMessages = useCallback(async () => {
        if (!token || !exchangeRequestId) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`/api/messages/${exchangeRequestId}`, config);
            setMessages(data);
        } catch (err) {
            console.error('Error fetching messages:', err);
            toast.error('Failed to load messages.');
        }
    }, [exchangeRequestId, token]);

    // <--- NEW: Function to fetch review status ---
    const fetchReviewStatus = useCallback(async (exchangeId) => {
        if (!token || !exchangeId) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`/api/reviews/exchange-status/${exchangeId}`, config);
            setReviewStatus(data);
        } catch (err) {
            console.error('Error fetching review status:', err);
            toast.error('Failed to fetch review status.');
        }
    }, [token]);

    useEffect(() => {
        fetchExchangeDetails();
        fetchMessages();
        // Set up interval for messages
        const messageInterval = setInterval(fetchMessages, 5000);
        return () => clearInterval(messageInterval);
    }, [fetchExchangeDetails, fetchMessages]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessageContent.trim()) {
            toast.warn('Message cannot be empty.');
            return;
        }
        if (!exchange || !user) {
            toast.error('Cannot send message: Exchange or user data missing.');
            return;
        }

        const receiverId = exchange.requester._id === user._id ? exchange.owner._id : exchange.requester._id;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const messageData = {
                receiverId,
                exchangeRequestId,
                content: newMessageContent,
            };
            await axios.post('/api/messages', messageData, config);
            setNewMessageContent('');
            toast.success('Message sent!');
            fetchMessages(); // Refresh messages after sending
        } catch (error) {
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Failed to send message: ${errorMessage}`);
            console.error('Error sending message:', error);
        }
    };

    const updateRequestStatus = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this request?`)) {
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.put(`/api/exchanges/${exchangeRequestId}/status`, { status: newStatus }, config);
            setExchange(data); // Update exchange state to reflect new status
            toast.success(`Request ${newStatus.toLowerCase()} successfully!`);

            if (newStatus === 'Completed') {
                // If exchange is completed, re-fetch review status to allow review
                await fetchReviewStatus(data._id);
                // Optionally show review form immediately
                if (reviewStatus?.canReview) {
                    setShowReviewForm(true);
                }
            } else if (newStatus === 'Accepted' || newStatus === 'Pending' || newStatus === 'Declined' || newStatus === 'Cancelled') {
                 // Clear review status if not completed
                setReviewStatus(null);
                setShowReviewForm(false);
            }
        } catch (error) {
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Failed to update request: ${errorMessage}`);
            console.error('Error updating request status:', error);
        }
    };

    // <--- NEW: Handle review submission callback ---
    const handleReviewSubmitted = (submittedReview) => {
        toast.success('Review submitted successfully!');
        setShowReviewForm(false); // Hide the form after submission
        // Update review status to reflect that a review has been made
        setReviewStatus(prev => ({ ...prev, canReview: false, hasReviewed: true, message: 'You have already reviewed this exchange.' }));
    };

    if (loading) {
        return <div className="status-message">Loading exchange details...</div>;
    }

    if (error) {
        return <div className="status-message error-message">Error: {error}</div>;
    }

    if (!exchange) {
        return <div className="status-message no-content">Exchange request not found or you are not authorized to view it.</div>;
    }

    const isRequester = exchange.requester._id === user._id;
    const isOwner = exchange.owner._id === user._id;
    const otherParty = isRequester ? exchange.owner : exchange.requester;

    const getStatusClass = (status) => {
        switch (status) {
            case 'Accepted': return 'status-accepted';
            case 'Declined': return 'status-declined';
            case 'Completed': return 'status-completed';
            case 'Cancelled': return 'status-cancelled';
            default: return 'status-pending';
        }
    };

    return (
        <div className="exchange-details-container">
            <h1 className="page-heading">Exchange Request Details</h1>

            <div className="exchange-info-card">
                <p><strong>Status:</strong> <span className={`exchange-status ${getStatusClass(exchange.status)}`}>{exchange.status}</span></p>
                <p><strong>Requested Book:</strong> <span className="highlight">"{exchange.requestedBook.title}"</span> by {exchange.requestedBook.author} (Owner: {exchange.owner.username})</p>
                {exchange.offeredBook && (
                    <p><strong>Offered Book:</strong> <span className="highlight">"{exchange.offeredBook.title}"</span> by {exchange.offeredBook.author} (Owner: {exchange.requester.username})</p>
                )}
                <p><strong>Initial Message:</strong> {exchange.requestMessage || 'No message provided.'}</p>
                <p><strong>Initiated by:</strong> {exchange.requester.username}</p>
                <p className="meta-info">On: {new Date(exchange.createdAt).toLocaleDateString()}</p>
                {exchange.status === 'Completed' && exchange.completedAt && (
                    <p className="meta-info status-completed">Completed on: {new Date(exchange.completedAt).toLocaleDateString()}.</p>
                )}
            </div>

            {/* Status Update Actions */}
            <div className="exchange-actions-bar">
                {exchange.status === 'Pending' && isOwner && (
                    <>
                        <button onClick={() => updateRequestStatus('Accepted')} className="btn btn-success">Accept Request</button>
                        <button onClick={() => updateRequestStatus('Declined')} className="btn btn-danger">Decline Request</button>
                    </>
                )}
                {(exchange.status === 'Pending' || exchange.status === 'Accepted') && (isRequester || isOwner) && (
                    <button onClick={() => updateRequestStatus('Cancelled')} className="btn btn-warning">Cancel Request</button>
                )}
                {exchange.status === 'Accepted' && (isRequester || isOwner) && (
                    <button onClick={() => updateRequestStatus('Completed')} className="btn btn-primary">Mark as Completed</button>
                )}
            </div>

            {/* Review Section --- NEW --- */}
            {exchange.status === 'Completed' && reviewStatus && (
                <div className="review-section">
                    <h2>Review {otherParty.username}</h2>
                    {reviewStatus.hasReviewed ? (
                        <p className="status-message reviewed-message">You have already reviewed this exchange.</p>
                    ) : reviewStatus.canReview ? (
                        <>
                            <button onClick={() => setShowReviewForm(!showReviewForm)} className="btn btn-info">
                                {showReviewForm ? 'Hide Review Form' : 'Leave a Review'}
                            </button>
                            {showReviewForm && (
                                <ReviewForm
                                    revieweeId={reviewStatus.otherPartyId}
                                    exchangeId={exchange._id}
                                    onReviewSubmitted={handleReviewSubmitted}
                                />
                            )}
                        </>
                    ) : (
                        <p className="status-message">Unable to review this exchange at this time.</p>
                    )}
                </div>
            )}


            {/* Messaging Section - Only visible if exchange is Accepted or Pending */}
            {(exchange.status === 'Pending' || exchange.status === 'Accepted') && (
                <div className="messaging-section">
                    <h2>Messages with {otherParty.username}</h2>
                    <div className="message-list">
                        {messages.length === 0 ? (
                            <p className="status-message no-messages">No messages yet for this exchange.</p>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg._id} className={`message-item ${msg.sender._id === user._id ? 'sent' : 'received'}`}>
                                    <p className="message-sender">{msg.sender._id === user._id ? 'You' : msg.sender.username}</p>
                                    <p className="message-content">{msg.content}</p>
                                    <span className="message-timestamp">
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="message-form">
                        <textarea
                            value={newMessageContent}
                            onChange={(e) => setNewMessageContent(e.target.value)}
                            rows="2"
                            placeholder="Type your message here..."
                            className="message-input"
                        ></textarea>
                        <button type="submit" className="btn btn-send">Send</button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default ExchangeDetailsPage;