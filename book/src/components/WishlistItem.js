// frontend/src/components/WishlistItem.js
import React from 'react';
import { Link } from 'react-router-dom';
import './WishlistItem.css'; // We'll create this for styling
import placeholderImage from '../assests/placeholder.png'; // Make sure this path is correct

function WishlistItem({ item, onRemove }) {
    if (!item) return null;

    const bookImage = item.book?.imageUrl || placeholderImage;
    const bookTitle = item.book?.title || item.title;
    const bookAuthor = item.book?.author || item.author;

    return (
        <div className="wishlist-item-card">
            <Link to={item.book ? `/books/${item.book._id}` : '#'} className="wishlist-item-content">
                <img
                    src={bookImage}
                    alt={bookTitle}
                    className="wishlist-book-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                />
                <div className="wishlist-item-details">
                    <h3 className="wishlist-item-title">{bookTitle}</h3>
                    <p className="wishlist-item-author">by {bookAuthor}</p>
                    {item.notes && <p className="wishlist-item-notes">Notes: {item.notes}</p>}
                    {item.book && item.book.owner && item.book.owner.username && (
                        <p className="wishlist-item-owner">Owner: {item.book.owner.username}</p>
                    )}
                    {item.book && item.book.availabilityStatus && (
                        <p className="wishlist-item-status">Status: {item.book.availabilityStatus}</p>
                    )}
                </div>
            </Link>
            <div className="wishlist-item-actions">
                <button onClick={() => onRemove(item._id)} className="btn btn-danger btn-sm">
                    Remove
                </button>
            </div>
        </div>
    );
}

export default WishlistItem;