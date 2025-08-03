// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import './AuthForms.css'; // Link to new shared CSS

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false); // For button loading state
    const navigate = useNavigate();
    const { register } = useAuth(); // Get the register function from context

    const submitHandler = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }
        setSubmitting(true);
        const success = await register(username, email, password);
        setSubmitting(false);
        if (success) {
            navigate('/'); // Redirect to home on successful registration (and auto-login)
        }
        // Error messages handled by toast.error in AuthContext
    };

    return (
        <div className="auth-page-container register-page-container">
            {/* The auth-image-section will be hidden or overridden by CSS for this page */}
            <div className="auth-form-wrapper register-form-wrapper">
                {/* auth-header-content will be styled to be readable on transparent background */}
                <div className="auth-header-content">
                    <i className="fas fa-book-reader auth-icon"></i> {/* Font Awesome Icon */}
                    <h1 className="auth-welcome-heading">Join SwapShelf</h1>
                    <p className="auth-description">
                        Register to start discovering, sharing, and borrowing books today!
                    </p>
                </div>

                <form onSubmit={submitHandler} className="auth-form">
                    <h2 className="form-title">Register</h2>
                    {/* --- CRITICAL FIX: Add the actual form groups here --- */}
                    <div className="form-group">
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email Address:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    {/* --- END CRITICAL FIX --- */}
                    <button type="submit" className="form-submit-button" disabled={submitting}>
                        {submitting ? 'Registering...' : 'Register'}
                    </button>
                    <p className="form-link-text">
                        Already have an account? <Link to="/login" className="form-link">Login here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;