// frontend/src/pages/ExchangeRequestsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom'; // Corrected import for Link
import './ExchangeRequests.css'; // Import ExchangeRequests.css
import '../App.css'; // Import App.css for page-heading, status-message etc.

function ExchangeRequestsPage() {
    const { token, user } = useAuth();
    const [sentRequests, setSentRequests] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchExchangeRequests = useCallback(async () => {
        if (!token) { // Ensure token exists before trying to fetch
             setLoading(false); // Set loading to false if no token
             setError('Not authenticated. Please log in.');
             return;
        }
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('/api/exchanges/myrequests', config);
            setSentRequests(data.sentRequests);
            setReceivedRequests(data.receivedRequests);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching exchange requests:', err);
            const errorMessage = err.response && err.response.data.message
                ? err.response.data.message
                : err.message;
            setError(`Failed to load exchange requests: ${errorMessage}`);
            toast.error(`Failed to load exchange requests: ${errorMessage}`);
            setLoading(false);
        }
    }, [token]); // Dependency on token

    useEffect(() => {
        fetchExchangeRequests();
    }, [fetchExchangeRequests]);

    const updateRequestStatus = async (requestId, newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this request?`)) {
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/exchanges/${requestId}/status`, { status: newStatus }, config);
            toast.success(`Request ${newStatus.toLowerCase()} successfully!`);
            fetchExchangeRequests(); // Re-fetch to update lists
        } catch (error) {
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Failed to update request: ${errorMessage}`);
            console.error('Error updating request status:', error);
        }
    };

    const getStatusColorClass = (status) => {
        switch (status) {
            case 'Accepted': return 'status-accepted';
            case 'Declined': return 'status-declined';
            case 'Completed': return 'status-completed';
            case 'Cancelled': return 'status-cancelled';
            default: return 'status-pending'; // Pending
        }
    };

    // Define renderRequestCard as a local helper function *before* the main component's return
    const renderRequestCard = (request, type) => { // Removed immediate return arrow here
        return ( // This return belongs to renderRequestCard function
            <div key={request._id} className="exchange-request-card">
                {type === 'sent' ? (
                    <>
                        <p><strong>You requested:</strong> <span className="font-semibold">"{request.requestedBook.title}"</span> by {request.requestedBook.author} (from <span className="font-medium">{request.owner.username}</span>)</p>
                        {request.offeredBook && (
                            <p><strong>You offered:</strong> <span className="font-semibold">"{request.offeredBook.title}"</span> by {request.offeredBook.author}</p>
                        )}
                    </>
                ) : (
                    <>
                        <p><strong>Request for your book:</strong> <span className="font-semibold">"{request.requestedBook.title}"</span> by {request.requestedBook.author}</p>
                        <p><strong>From:</strong> <span className="font-medium">{request.requester.username}</span></p>
                        {request.offeredBook && (
                            <p><strong>They offered:</strong> <span className="font-semibold">"{request.offeredBook.title}"</span> by {request.offeredBook.author}</p>
                        )}
                    </>
                )}
                <p className="request-meta-text"><strong>Status:</strong> <span className={`request-status-text ${getStatusColorClass(request.status)}`}>{request.status}</span></p>
                <p className="request-meta-text">Requested on: {new Date(request.createdAt).toLocaleDateString()}</p>

                <div className="request-actions">
                    <Link to={`/exchanges/${request._id}`} className="action-button view-details-button">
                        View Details & Chat
                    </Link>

                    {type === 'received' && request.status === 'Pending' && (
                        <>
                            <button
                                onClick={() => updateRequestStatus(request._id, 'Accepted')}
                                className="action-button accept-button"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => updateRequestStatus(request._id, 'Declined')}
                                className="action-button decline-button"
                            >
                                Declined
                            </button>
                        </>
                    )}
                    {(request.status === 'Pending' || request.status === 'Accepted') && (user._id === request.requester._id || user._id === request.owner._id) && (
                        <button
                            onClick={() => updateRequestStatus(request._id, 'Cancelled')}
                            className="action-button cancel-button"
                        >
                            Cancel
                        </button>
                    )}
                    {request.status === 'Accepted' && (user._id === request.requester._id || user._id === request.owner._id) && (
                        <button
                            onClick={() => updateRequestStatus(request._id, 'Completed')}
                            className="action-button complete-button"
                        >
                            Mark as Completed
                        </button>
                    )}
                </div>
            </div>
        );
    }; // End of renderRequestCard function

    // This is the main return for the ExchangeRequestsPage component
    if (loading) {
        return <div className="status-message">Loading exchange requests...</div>;
    }

    if (error) {
        return <div className="status-message error-message">Error: {error}</div>;
    }

    return (
        <div className="exchange-requests-page-container">
            <h1 className="page-heading">My Exchange Requests</h1>

            <section className="exchange-requests-section">
                <h2 className="section-heading">Sent Requests</h2>
                {sentRequests.length === 0 ? (
                    <p className="status-message info-message">You haven't sent any exchange requests yet.</p>
                ) : (
                    sentRequests.map(request => renderRequestCard(request, 'sent'))
                )}
            </section>

            <section className="exchange-requests-section">
                <h2 className="section-heading">Received Requests</h2>
                {receivedRequests.length === 0 ? (
                    <p className="status-message info-message">You haven't received any exchange requests yet.</p>
                ) : (
                    receivedRequests.map(request => renderRequestCard(request, 'received'))
                )}
            </section>
        </div>
    );
}

export default ExchangeRequestsPage;