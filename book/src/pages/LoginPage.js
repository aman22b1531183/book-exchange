// frontend/src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import './AuthForms.css'; // Link to new shared CSS

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false); // For button loading state
    const navigate = useNavigate();
    const { login } = useAuth(); // Get the login function from context

    const submitHandler = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const success = await login(email, password);
        setSubmitting(false);
        if (success) {
            navigate('/'); // Redirect to home on successful login
        }
        // Error messages handled by toast.error in AuthContext
    };

    return (
        <div className="auth-page-container register-page-container"> {/* <--- ADDED register-page-container HERE */}
            {/* The auth-image-section will be hidden by CSS for this transparent page */}
            <div className="auth-form-wrapper register-form-wrapper"> {/* <--- ADDED register-form-wrapper HERE */}
                <div className="auth-header-content">
                    <i className="fas fa-book-open auth-icon"></i> {/* Font Awesome Book Icon */}
                    <h1 className="auth-welcome-heading">Welcome to SwapShelf</h1>
                    <p className="auth-description">
                        Log in to discover, share, and borrow books from our community library.
                    </p>
                </div>

                <form onSubmit={submitHandler} className="auth-form">
                    <h2 className="form-title">Login</h2>
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
                    <button type="submit" className="form-submit-button" disabled={submitting}>
                        {submitting ? 'Logging In...' : 'Login'}
                    </button>
                    <p className="form-link-text">
                        Don't have an account? <Link to="/register" className="form-link">Register here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;