// frontend/src/components/ReviewForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import './ReviewForm.css'; // We'll create this for styling the form
import './Form.css'; // General form styles might be useful

function ReviewForm({ revieweeId, exchangeId, onReviewSubmitted }) {
    const { token } = useAuth();
    const [rating, setRating] = useState(0); // 0 to 5 stars
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating!');
            return;
        }

        setSubmitting(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };
            const reviewData = {
                revieweeId,
                exchangeId,
                rating,
                comment,
            };
            const { data } = await axios.post('/api/reviews', reviewData, config);
            onReviewSubmitted(data); // Callback to parent component
            setRating(0);
            setComment('');
        } catch (error) {
            console.error('Error submitting review:', error);
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Failed to submit review: ${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="review-form-container form-container"> {/* Reuse general form container */}
            <h3 className="form-heading">Leave a Review</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group rating-group">
                    <label>Rating:</label>
                    <div className="stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                className={`star ${star <= rating ? 'filled' : ''}`}
                                onClick={() => setRating(star)}
                            >
                                &#9733; {/* Unicode star character */}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="comment">Comment (Optional):</label>
                    <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows="4"
                        maxLength="500"
                        className="form-input form-textarea"
                        placeholder="Share your experience (e.g., communication, book condition, overall fairness)."
                    ></textarea>
                </div>
                <button type="submit" className="form-button" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>
        </div>
    );
}

export default ReviewForm;