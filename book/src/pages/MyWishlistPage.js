// frontend/src/pages/MyWishlistPage.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import WishlistItem from '../components/WishlistItem'; // Reusing the item component
import '../App.css'; // For page-heading, status-message
import './MyWishlist.css'; // New CSS for this page

function MyWishlistPage() {
    const { token } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMyWishlist = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setError('Authentication token not found. Please log in.');
            return;
        }
        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const { data } = await axios.get('/api/wishlist', config);
            setWishlist(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching wishlist:', err);
            const errorMessage = err.response && err.response.data.message
                ? err.response.data.message
                : err.message;
            setError(`Failed to load wishlist: ${errorMessage}`);
            toast.error(`Failed to load wishlist: ${errorMessage}`);
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchMyWishlist();
    }, [fetchMyWishlist]);

    const handleRemoveWishlistItem = async (wishlistItemId) => {
        if (!window.confirm('Are you sure you want to remove this item from your wishlist?')) {
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`/api/wishlist/${wishlistItemId}`, config);
            toast.info('Item removed from wishlist!');
            // Update local state to remove the item
            setWishlist(prevWishlist => prevWishlist.filter(item => item._id !== wishlistItemId));
        } catch (error) {
            console.error('Error removing wishlist item:', error);
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Failed to remove item: ${errorMessage}`);
        }
    };

    if (loading) {
        return <div className="status-message">Loading wishlist...</div>;
    }

    if (error) {
        return <div className="status-message error-message">Error: {error}</div>;
    }

    return (
        <div className="my-wishlist-page-container">
            <h1 className="page-heading">My Wishlist</h1>
            {wishlist.length === 0 ? (
                <p className="status-message no-wishlist">Your wishlist is empty. Browse books to add items!</p>
            ) : (
                <div className="wishlist-grid">
                    {wishlist.map(item => (
                        <WishlistItem key={item._id} item={item} onRemove={handleRemoveWishlistItem} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyWishlistPage;