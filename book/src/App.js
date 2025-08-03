// frontend/src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePages';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import BookListPage from './pages/BookListPage';
import AddBookPage from './pages/AddBookPage';
import MyBooksPage from './pages/MyBooksPage';
import ExchangeRequestsPage from './pages/ExchangeRequestsPage';
import ExchangeDetailsPage from './pages/ExchangeDetailsPage';
import RequestExchangePage from './pages/RequestExchangePage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import MyWishlistPage from './pages/MyWishlistPage';
import AdminDashboardPage from './pages/AdminDashboardPage'; // <--- NEW IMPORT
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer'; // Corrected path

function App() {
    return (
        <div className="App">
            <Header />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />

                    <Route path="/books" element={<BookListPage />} />

                    {/* Protected Routes */}
                    <Route path="/books/add" element={<ProtectedRoute><AddBookPage /></ProtectedRoute>} />
                    <Route path="/my-books" element={<ProtectedRoute><MyBooksPage /></ProtectedRoute>} />
                    <Route path="/request-exchange" element={<ProtectedRoute><RequestExchangePage /></ProtectedRoute>} />
                    <Route path="/exchanges" element={<ProtectedRoute><ExchangeRequestsPage /></ProtectedRoute>} />
                    <Route path="/exchanges/:id" element={<ProtectedRoute><ExchangeDetailsPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                    <Route path="/wishlist" element={<ProtectedRoute><MyWishlistPage /></ProtectedRoute>} />
                    {/* NEW: Admin Dashboard Route */}
                    <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} /> {/* <--- NEW ROUTE */}
                    <Route path="*" element={<h1>404 Not Found</h1>} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
}

export default App;