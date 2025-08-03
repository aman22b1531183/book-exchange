// frontend/src/pages/AdminDashboardPage.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // Import Link for exchange details
import '../App.css'; // For page-heading, status-message
import './AdminDashboard.css'; // We'll update this for styling

function AdminDashboardPage() {
    const { user, token, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // User Management States
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState(null);

    // Book Management States
    const [books, setBooks] = useState([]);
    const [booksLoading, setBooksLoading] = useState(true);
    const [booksError, setBooksError] = useState(null);

    // Exchange Management States <--- NEW STATES
    const [exchanges, setExchanges] = useState([]);
    const [exchangesLoading, setExchangesLoading] = useState(true);
    const [exchangesError, setExchangesError] = useState(null);
    const validExchangeStatuses = ['Pending', 'Accepted', 'Declined', 'Cancelled', 'Completed'];


    useEffect(() => {
        // Redirect if not authenticated or not an admin
        if (!isAuthenticated) {
            navigate('/login'); // Not logged in
            toast.error('Please log in to view this page.');
        } else if (!user || !user.isAdmin) {
            navigate('/'); // Logged in but not admin
            toast.error('You are not authorized to view this page.');
        }
        setLoading(false); // Initial page loading state is done after checks
    }, [isAuthenticated, user, navigate]);

    // Fetch All Users Function (existing)
    const fetchAllUsers = useCallback(async () => {
        if (!token || !user || !user.isAdmin) {
            setUsersLoading(false);
            setUsersError('Not authorized.');
            return;
        }
        setUsersLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('/api/admin/users', config);
            setUsers(data);
            setUsersLoading(false);
        } catch (err) {
            console.error('Admin: Error fetching all users:', err);
            const errorMessage = err.response && err.response.data.message
                ? err.response.data.message
                : err.message;
            setUsersError(`Failed to load users: ${errorMessage}`);
            toast.error(`Admin: Failed to load users: ${errorMessage}`);
            setUsersLoading(false);
        }
    }, [token, user]);

    // Delete User Function (existing)
    const handleDeleteUser = async (userIdToDelete) => {
        if (!window.confirm('Are you sure you want to delete this user and all their associated data? This action cannot be undone.')) {
            return;
        }
        if (!token || !user || !user.isAdmin) {
            toast.error('Not authorized to delete users.');
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`/api/admin/users/${userIdToDelete}`, config);
            toast.success('User deleted successfully!');
            fetchAllUsers(); // Re-fetch the list to update UI
            // Also re-fetch books and exchanges as their owners/books might be gone
            fetchAllBooks();
            fetchAllExchanges();
        } catch (error) {
            console.error('Admin: Error deleting user:', error);
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Admin: Failed to delete user: ${errorMessage}`);
        }
    };

    // Fetch All Books Function (existing)
    const fetchAllBooks = useCallback(async () => {
        if (!token || !user || !user.isAdmin) {
            setBooksLoading(false);
            setBooksError('Not authorized.');
            return;
        }
        setBooksLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('/api/admin/books', config);
            setBooks(data);
            setBooksLoading(false);
        } catch (err) {
            console.error('Admin: Error fetching all books:', err);
            const errorMessage = err.response && err.response.data.message
                ? err.response.data.message
                : err.message;
            setBooksError(`Failed to load books: ${errorMessage}`);
            toast.error(`Admin: Failed to load books: ${errorMessage}`);
            setBooksLoading(false);
        }
    }, [token, user]);

    // Delete Book Function (existing)
    const handleDeleteBook = async (bookIdToDelete) => {
        if (!window.confirm('Are you sure you want to delete this book and all associated exchange requests, messages, etc.? This action cannot be undone.')) {
            return;
        }
        if (!token || !user || !user.isAdmin) {
            toast.error('Not authorized to delete books.');
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`/api/admin/books/${bookIdToDelete}`, config);
            toast.success('Book deleted successfully!');
            fetchAllBooks(); // Re-fetch the list to update UI
            // Also re-fetch exchanges as the book might be gone
            fetchAllExchanges();
        } catch (error) {
            console.error('Admin: Error deleting book:', error);
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Admin: Failed to delete book: ${errorMessage}`);
        }
    };

    // <--- NEW: Fetch All Exchanges Function ---
    const fetchAllExchanges = useCallback(async () => {
        if (!token || !user || !user.isAdmin) {
            setExchangesLoading(false);
            setExchangesError('Not authorized.');
            return;
        }
        setExchangesLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('/api/admin/exchanges', config);
            setExchanges(data);
            setExchangesLoading(false);
        } catch (err) {
            console.error('Admin: Error fetching all exchanges:', err);
            const errorMessage = err.response && err.response.data.message
                ? err.response.data.message
                : err.message;
            setExchangesError(`Failed to load exchanges: ${errorMessage}`);
            toast.error(`Admin: Failed to load exchanges: ${errorMessage}`);
            setExchangesLoading(false);
        }
    }, [token, user]);

    // <--- NEW: Update Exchange Status Function (Admin action) ---
    const handleUpdateExchangeStatus = async (exchangeId, newStatus) => {
        if (!window.confirm(`Are you sure you want to set this exchange status to "${newStatus}"? This may affect book availability.`)) {
            return;
        }
        if (!token || !user || !user.isAdmin) {
            toast.error('Not authorized to update exchange status.');
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/admin/exchanges/${exchangeId}/status`, { status: newStatus }, config);
            toast.success(`Exchange status updated to "${newStatus}"!`);
            fetchAllExchanges(); // Re-fetch the list to update UI
            fetchAllBooks(); // Books status might change after exchange update
        } catch (error) {
            console.error('Admin: Error updating exchange status:', error);
            const errorMessage = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(`Admin: Failed to update exchange status: ${errorMessage}`);
        }
    };


    useEffect(() => {
        if (user && user.isAdmin) {
            fetchAllUsers();
            fetchAllBooks();
            fetchAllExchanges(); // <--- NEW: Fetch exchanges when admin dashboard loads
        }
    }, [user, fetchAllUsers, fetchAllBooks, fetchAllExchanges]);


    if (loading || usersLoading || booksLoading || exchangesLoading) { // Combine all loading states
        return <div className="status-message">Loading dashboard...</div>;
    }

    if (error || usersError || booksError || exchangesError) { // Combine all error states
        return <div className="status-message error-message">Error: {error || usersError || booksError || exchangesError}</div>;
    }

    if (!user || !user.isAdmin) { // Final check after loading
        return <div className="status-message error-message">Access Denied.</div>;
    }

    return (
        <div className="admin-dashboard-container">
            <h1 className="page-heading">Admin Dashboard</h1>
            <p className="status-message">Welcome, Administrator {user.username}!</p>

            <div className="dashboard-sections">
                <section className="dashboard-section user-management-section">
                    <h2 className="section-heading">User Management</h2>
                    {users.length === 0 ? (
                        <p className="status-message">No users found.</p>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Admin</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id}>
                                            <td>{u._id}</td>
                                            <td>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td>{u.isAdmin ? 'Yes' : 'No'}</td>
                                            <td>
                                                {u._id === user._id ? (
                                                    <span className="admin-cannot-delete">Cannot Delete Self</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id)}
                                                        className="btn btn-danger btn-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="dashboard-section book-management-section">
                    <h2 className="section-heading">Book Management</h2>
                    {books.length === 0 ? (
                        <p className="status-message">No books found.</p>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Author</th>
                                        <th>Owner</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {books.map(b => (
                                        <tr key={b._id}>
                                            <td>{b._id}</td>
                                            <td>{b.title}</td>
                                            <td>{b.author}</td>
                                            <td>{b.owner ? b.owner.username : 'Unknown'}</td>
                                            <td>{b.availabilityStatus}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleDeleteBook(b._id)}
                                                    className="btn btn-danger btn-sm"
                                                >
                                                    Delete
                                                </button>
                                                {/* Add Edit button later */}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* NEW: Exchange Management Section */}
                <section className="dashboard-section exchange-management-section">
                    <h2 className="section-heading">Exchange Management</h2>
                    {exchanges.length === 0 ? (
                        <p className="status-message">No exchange requests found.</p>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Requester</th>
                                        <th>Owner</th>
                                        <th>Requested Book</th>
                                        <th>Offered Book</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exchanges.map(ex => (
                                        <tr key={ex._id}>
                                            <td>
                                                <Link to={`/exchanges/${ex._id}`} className="admin-link-id">
                                                    {ex._id.substring(0, 6)}...
                                                </Link>
                                            </td>
                                            <td>{ex.requester ? ex.requester.username : 'N/A'}</td>
                                            <td>{ex.owner ? ex.owner.username : 'N/A'}</td>
                                            <td>{ex.requestedBook ? ex.requestedBook.title : 'N/A'}</td>
                                            <td>{ex.offeredBook ? ex.offeredBook.title : 'N/A'}</td>
                                            <td>
                                                <select
                                                    value={ex.status}
                                                    onChange={(e) => handleUpdateExchangeStatus(ex._id, e.target.value)}
                                                    className="admin-status-select"
                                                >
                                                    {validExchangeStatuses.map(status => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                {/* Optionally add a direct delete button if needed, but status update is primary */}
                                                <Link to={`/exchanges/${ex._id}`} className="btn btn-info btn-sm">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default AdminDashboardPage;