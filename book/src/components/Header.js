// frontend/src/components/Header.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import './Header.css'; // Assuming this for Header styles

function Header() {
    const { user, isAuthenticated, logout, token } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Function to fetch unread notification count
    const fetchUnreadCount = useCallback(async () => {
        if (!token || !isAuthenticated) {
            setUnreadCount(0);
            return;
        }
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const { data } = await axios.get('/api/notifications/unread-count', config);
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Error fetching unread notification count:', error);
        }
    }, [token, isAuthenticated]);

    useEffect(() => {
        fetchUnreadCount();
        if (socket) {
            const handleNewNotification = () => {
                fetchUnreadCount();
            };
            socket.on('newNotification', handleNewNotification);
            return () => {
                socket.off('newNotification', handleNewNotification);
            };
        }
    }, [socket, fetchUnreadCount]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleDropdown = () => {
        setDropdownOpen(prev => !prev);
    };

    return (
        <header className="header">
            <nav className="main-nav">
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/books" className="nav-link">Browse Books</Link>
                {isAuthenticated && (
                    <>
                        <Link to="/books/add" className="nav-link">Add Book</Link>
                        <Link to="/my-books" className="nav-link">My Books</Link>
                        <Link to="/exchanges" className="nav-link">My Exchanges</Link>
                    </>
                )}
            </nav>

            <div className="header-auth-section">
                {isAuthenticated ? (
                    <div className="user-menu-container" ref={dropdownRef}>
                        <button onClick={toggleDropdown} className="user-menu-toggle">
                            {user.profilePictureUrl ? (
                                <img
                                    src={user.profilePictureUrl}
                                    alt={user.username}
                                    className="user-avatar-header"
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwM_ABMwdQL7Zb4rLmaMl964QE9D4J20TA3w&s'; }}
                                />
                            ) : (
                                <i className="fas fa-user-circle"></i> // Placeholder icon
                            )}
                            <span>{user.username}</span>
                            <i className={`fas fa-chevron-down dropdown-arrow ${dropdownOpen ? 'open' : ''}`}></i>
                        </button>

                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                <Link to="/profile" onClick={() => setDropdownOpen(false)} className="dropdown-item">My Profile</Link>
                                <Link to="/wishlist" onClick={() => setDropdownOpen(false)} className="dropdown-item">My Wishlist</Link>
                                <Link to="/notifications" onClick={() => setDropdownOpen(false)} className="dropdown-item notifications-dropdown-item">
                                    Notifications
                                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                                </Link>
                                {user.isAdmin && (
                                    <Link to="/admin/dashboard" onClick={() => setDropdownOpen(false)} className="dropdown-item admin-dashboard-link">
                                        Admin Dashboard
                                    </Link>
                                )}
                                <div className="dropdown-divider"></div>
                                <button onClick={handleLogout} className="dropdown-item logout-button">Logout</button>
                            </div>
                        )}
                    </div>
                ) : (
                    // <--- MODIFIED: Restore Login/Register links when not authenticated --->
                    <div className="header-login-register">
                        <Link to="/register" className="btn btn-register">Register</Link>
                        <Link to="/login" className="btn btn-login">Login</Link>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;