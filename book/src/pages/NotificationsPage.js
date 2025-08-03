// frontend/src/pages/NotificationsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import '../App.css'; // For page-heading, status-message
import './Notifications.css'; // We'll create this for styling the page

function NotificationsPage() {
    const { token, user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNotifications = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setError('Authentication token not found. Please log in.');
            return;
        }
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const { data } = await axios.get('/api/notifications', config);
            setNotifications(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            const errorMessage = err.response && err.response.data.message
                ? err.response.data.message
                : err.message;
            setError(`Failed to load notifications: ${errorMessage}`);
            toast.error(`Failed to load notifications: ${errorMessage}`);
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            await axios.put(`/api/notifications/${notificationId}/read`, {}, config);
            toast.success('Notification marked as read!');
            // Update the state to reflect the change without re-fetching all
            setNotifications(prevNotifications =>
                prevNotifications.map(n => n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n)
            );
            // Optionally, also update unread count in header immediately
            // This would require a context for unread count
        } catch (error) {
            console.error('Error marking notification as read:', error);
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Failed to mark as read: ${errorMessage}`);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            await axios.put('/api/notifications/mark-all-read', {}, config);
            toast.success('All notifications marked as read!');
            // Update all unread notifications in state to read
            setNotifications(prevNotifications =>
                prevNotifications.map(n => n.isRead ? n : { ...n, isRead: true, readAt: new Date() })
            );
            // Optionally, also update unread count in header immediately
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Failed to mark all as read: ${errorMessage}`);
        }
    };

    const getLinkForNotification = (notification) => {
        switch (notification.type) {
            case 'exchange_request':
            case 'status_update':
            case 'message':
                return `/exchanges/${notification.referenceId}`;
            // Add cases for other notification types if they link to other pages
            default:
                return '#'; // No specific link or stay on notifications page
        }
    };

    if (loading) {
        return <div className="status-message">Loading notifications...</div>;
    }

    if (error) {
        return <div className="status-message error-message">Error: {error}</div>;
    }

    return (
        <div className="notifications-page-container">
            <h1 className="page-heading">My Notifications</h1>

            {notifications.length > 0 && (
                <div className="notifications-actions">
                    <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
                        Mark All as Read
                    </button>
                </div>
            )}

            {notifications.length === 0 ? (
                <p className="status-message no-notifications">You have no notifications yet.</p>
            ) : (
                <div className="notifications-list">
                    {notifications.map(notification => (
                        <div key={notification._id} className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}>
                            <div className="notification-content">
                                {notification.sender && notification.sender.profilePictureUrl && (
                                    <img src={notification.sender.profilePictureUrl} alt={notification.sender.username} className="notification-sender-avatar" />
                                )}
                                <p className="notification-message">
                                    {notification.message}
                                    <span className="notification-date">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </span>
                                </p>
                            </div>
                            <div className="notification-actions">
                                {!notification.isRead && (
                                    <button onClick={() => handleMarkAsRead(notification._id)} className="mark-read-btn">
                                        Mark as Read
                                    </button>
                                )}
                                {getLinkForNotification(notification) !== '#' && (
                                    <Link to={getLinkForNotification(notification)} className="view-details-link">
                                        View Details
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default NotificationsPage;