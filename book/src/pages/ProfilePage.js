// frontend/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import ReviewItem from '../components/ReviewItem';
import WishlistItem from '../components/WishlistItem'; // <--- NEW IMPORT
import '../components/Form.css';
import '../App.css';
import './Profile.css'; // We'll update this for wishlist section styling

function ProfilePage() {
    const { user: authUser, token, updateUserInContext } = useAuth();
    const { id: userIdFromUrl } = useParams();
    const isMyProfile = !userIdFromUrl || (authUser && authUser._id === userIdFromUrl);

    const userIdToDisplay = isMyProfile ? authUser?._id : userIdFromUrl;

    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        profilePictureUrl: '',
    });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [numReviews, setNumReviews] = useState(0);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState(null);

    const [wishlist, setWishlist] = useState([]); // <--- NEW STATE for wishlist
    const [wishlistLoading, setWishlistLoading] = useState(true); // <--- NEW STATE for wishlist loading
    const [wishlistError, setWishlistError] = useState(null); // <--- NEW STATE for wishlist error


    const fetchUserReviews = useCallback(async (id) => {
        if (!id) return;
        setReviewsLoading(true);
        try {
            const { data } = await axios.get(`/api/reviews/user/${id}`);
            setReviews(data.reviews);
            setAverageRating(data.averageRating);
            setNumReviews(data.numReviews);
            setReviewsLoading(false);
        } catch (err) {
            console.error('Error fetching user reviews:', err);
            setReviewsError('Failed to load reviews.');
            toast.error('Failed to load user reviews.');
            setReviewsLoading(false);
        }
    }, []);

    // <--- NEW: Function to fetch user's wishlist ---
    const fetchMyWishlist = useCallback(async () => {
        if (!token || !isMyProfile) { // Only fetch if it's my profile and I have a token
            setWishlistLoading(false);
            setWishlist([]); // Clear wishlist if not my profile or not authenticated
            return;
        }
        setWishlistLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const { data } = await axios.get('/api/wishlist', config);
            setWishlist(data);
            setWishlistLoading(false);
        } catch (err) {
            console.error('Error fetching wishlist:', err);
            setWishlistError('Failed to load wishlist.');
            toast.error('Failed to load wishlist.');
            setWishlistLoading(false);
        }
    }, [token, isMyProfile]); // Dependency on token and isMyProfile

    const fetchUserProfile = useCallback(async (id) => {
        if (!id) {
            setLoading(false);
            setError('User ID not available to fetch profile.');
            return;
        }
        let currentToken = null;
        if (isMyProfile && token) {
            currentToken = token;
        }

        try {
            setLoading(true);
            const config = currentToken ? { headers: { Authorization: `Bearer ${currentToken}` } } : {};
            const { data } = await axios.get(`/api/auth/profile/${id}`, config);
            setProfileData({
                username: data.username || '',
                email: data.email || '',
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                address: data.address || '',
                city: data.city || '',
                state: data.state || '',
                zipCode: data.zipCode || '',
                profilePictureUrl: data.profilePictureUrl || 'https://via.placeholder.com/150',
            });
            setLoading(false);
        } catch (err) {
            console.error('Error fetching profile:', err);
            const errorMessage = err.response && err.response.data.message
                ? err.response.data.message
                : err.message;
            setError(`Failed to load profile: ${errorMessage}`);
            toast.error(`Failed to load profile: ${errorMessage}`);
            setLoading(false);
        }
    }, [isMyProfile, token]);

    useEffect(() => {
        if (userIdToDisplay) {
            fetchUserProfile(userIdToDisplay);
            fetchUserReviews(userIdToDisplay);
        }
        if (isMyProfile) { // Only fetch wishlist if it's my own profile
            fetchMyWishlist();
        }
    }, [userIdToDisplay, isMyProfile, fetchUserProfile, fetchUserReviews, fetchMyWishlist]);

    const handleChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        if (e.target.name === 'password') setPassword(e.target.value);
        if (e.target.name === 'confirmPassword') setConfirmPassword(e.target.value);
    };

    const handleFileChange = (e) => {
        setProfileImageFile(e.target.files[0]);
        if (e.target.files[0]) {
            setProfileData(prev => ({
                ...prev,
                profilePictureUrl: URL.createObjectURL(e.target.files[0])
            }));
        } else {
            setProfileData(prev => ({
                ...prev,
                profilePictureUrl: prev.profilePictureUrl || 'https://via.placeholder.com/150'
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password && password !== confirmPassword) {
            toast.error('New passwords do not match!');
            return;
        }

        if (!isMyProfile) {
            toast.error('You can only update your own profile.');
            return;
        }

        const dataToUpdate = new FormData();
        dataToUpdate.append('username', profileData.username);
        dataToUpdate.append('email', profileData.email);
        dataToUpdate.append('firstName', profileData.firstName);
        dataToUpdate.append('lastName', profileData.lastName);
        dataToUpdate.append('address', profileData.address);
        dataToUpdate.append('city', profileData.city);
        dataToUpdate.append('state', profileData.state);
        dataToUpdate.append('zipCode', profileData.zipCode);

        if (profileImageFile) {
            dataToUpdate.append('profileImage', profileImageFile);
        } else {
            dataToUpdate.append('profilePictureUrl', profileData.profilePictureUrl);
        }

        if (password) {
            dataToUpdate.append('password', password);
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            };

            const { data } = await axios.put('/api/auth/profile', dataToUpdate, config);
            toast.success('Profile updated successfully!');
            updateUserInContext(data);
            setPassword('');
            setConfirmPassword('');
            fetchUserProfile(userIdToDisplay);

        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Failed to update profile: ${errorMessage}`);
        }
    };

    // <--- NEW: Handle removing item from wishlist from this page ---
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
        return <div className="status-message">Loading profile...</div>;
    }

    if (error) {
        return <div className="status-message error-message">Error: {error}</div>;
    }

    if (!profileData.username) {
        return <div className="status-message no-content">Profile data not available.</div>;
    }

    return (
        <div className="profile-page-container">
            <h1 className="page-heading">{isMyProfile ? 'My Profile' : `${profileData.username}'s Profile`}</h1>

            {/* Profile Info and Update Form (only for own profile) */}
            <div className="profile-section profile-details-section">
                {isMyProfile ? (
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group profile-picture-group">
                            <img
                                src={profileData.profilePictureUrl}
                                alt="Profile"
                                className="profile-avatar"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                            <label htmlFor="profileImageFile" className="form-label">Upload New Profile Picture (Optional):</label>
                            <input
                                type="file"
                                id="profileImageFile"
                                name="profileImageFile"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="form-input"
                            />
                            <label htmlFor="profilePictureUrlText" className="form-label">Or provide Image URL:</label>
                            <input
                                type="text"
                                id="profilePictureUrlText"
                                name="profilePictureUrl"
                                value={profileData.profilePictureUrl}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g., https://example.com/your-pic.jpg"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="username" className="form-label">Username:</label>
                            <input type="text" id="username" name="username" value={profileData.username} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email Address:</label>
                            <input type="email" id="email" name="email" value={profileData.email} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="firstName" className="form-label">First Name:</label>
                            <input type="text" id="firstName" name="firstName" value={profileData.firstName} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName" className="form-label">Last Name:</label>
                            <input type="text" id="lastName" name="lastName" value={profileData.lastName} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="address" className="form-label">Address:</label>
                            <input type="text" id="address" name="address" value={profileData.address} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="city" className="form-label">City:</label>
                            <input type="text" id="city" name="city" value={profileData.city} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="state" className="form-label">State:</label>
                            <input type="text" id="state" name="state" value={profileData.state} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="zipCode" className="form-label">Zip Code:</label>
                            <input type="text" id="zipCode" name="zipCode" value={profileData.zipCode} onChange={handleChange} className="form-input" />
                        </div>

                        <hr className="divider" />
                        <h2 className="section-heading">Change Password (Optional)</h2>
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">New Password:</label>
                            <input type="password" id="password" name="password" value={password} onChange={handlePasswordChange} className="form-input" placeholder="Enter new password (min 6 characters)" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">Confirm New Password:</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={handlePasswordChange} className="form-input" placeholder="Confirm new password" />
                        </div>
                        <button type="submit" className="form-button">Update Profile</button>
                    </form>
                ) : (
                    <div className="profile-display">
                         <div className="profile-picture-group">
                            <img
                                src={profileData.profilePictureUrl}
                                alt="Profile"
                                className="profile-avatar"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                        </div>
                        <p><strong>Username:</strong> {profileData.username}</p>
                        <p><strong>Email:</strong> {profileData.email}</p>
                        {profileData.firstName && <p><strong>Name:</strong> {profileData.firstName} {profileData.lastName}</p>}
                        {profileData.city && <p><strong>Location:</strong> {profileData.city}, {profileData.state}</p>}
                        {profileData.address && <p><strong>Address:</strong> {profileData.address}, {profileData.zipCode}</p>}
                    </div>
                )}
            </div>

            {/* Reviews Section */}
            <div className="profile-section reviews-section">
                <h2 className="section-heading">
                    {isMyProfile ? 'My Reviews' : `${profileData.username}'s Reviews`}
                </h2>
                {reviewsLoading ? (
                    <div className="status-message">Loading reviews...</div>
                ) : reviewsError ? (
                    <div className="status-message error-message">{reviewsError}</div>
                ) : (
                    <>
                        {numReviews > 0 ? (
                            <div className="average-rating-display">
                                <span className="rating-value">{averageRating.toFixed(1)}</span>
                                <span className="stars-display">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span key={star} className={`star ${star <= averageRating ? 'filled' : 'empty'}`}>
                                            &#9733;
                                        </span>
                                    ))}
                                </span>
                                <span className="num-reviews">({numReviews} reviews)</span>
                            </div>
                        ) : (
                            <p className="status-message no-reviews">No reviews yet.</p>
                        )}

                        <div className="reviews-list">
                            {reviews.length > 0 && reviews.map(review => (
                                <ReviewItem key={review._id} review={review} />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Wishlist Section --- NEW --- (only for my own profile) */}
            {isMyProfile && (
                <div className="profile-section wishlist-section">
                    <h2 className="section-heading">My Wishlist</h2>
                    {wishlistLoading ? (
                        <div className="status-message">Loading wishlist...</div>
                    ) : wishlistError ? (
                        <div className="status-message error-message">{wishlistError}</div>
                    ) : (
                        <>
                            {wishlist.length === 0 ? (
                                <p className="status-message no-wishlist">Your wishlist is empty. Browse books to add items!</p>
                            ) : (
                                <div className="wishlist-grid">
                                    {wishlist.map(item => (
                                        <WishlistItem key={item._id} item={item} onRemove={handleRemoveWishlistItem} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default ProfilePage;