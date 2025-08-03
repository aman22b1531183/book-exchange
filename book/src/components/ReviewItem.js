// frontend/src/components/ReviewItem.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ReviewItem.css'; // We'll create this for styling the review item

function ReviewItem({ review }) {
    if (!review || !review.reviewer) return null; // Basic check

    return (
        <div className="review-item-card">
            <div className="review-header">
                <Link to={`/profile/${review.reviewer._id}`} className="reviewer-info">
                    <img
                        src={review.reviewer.profilePictureUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwM_ABMwdQL7Zb4rLmaMl964QE9D4J20TA3w&s'}
                        alt={review.reviewer.username}
                        className="reviewer-avatar"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwM_ABMwdQL7Zb4rLmaMl964QE9D4J20TA3w&s'; }}
                    />
                    <span className="reviewer-username">{review.reviewer.username}</span>
                </Link>
                <div className="review-rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`star ${star <= review.rating ? 'filled' : 'empty'}`}>
                            &#9733;
                        </span>
                    ))}
                </div>
            </div>
            <p className="review-comment">{review.comment || 'No comment provided.'}</p>
            <div className="review-footer">
                <span className="review-date">Reviewed on: {new Date(review.createdAt).toLocaleDateString()}</span>
                {review.exchange && (
                    <Link to={`/exchanges/${review.exchange._id}`} className="review-exchange-link">
                        View Exchange
                    </Link>
                )}
            </div>
        </div>
    );
}

export default ReviewItem;