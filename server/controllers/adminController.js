// server/controllers/adminController.js
const User = require('../models/User');
const Book = require('../models/Book');
const ExchangeRequest = require('../models/ExchangeRequest'); // Import ExchangeRequest model
const Message = require('../models/Message');
const Review = require('../models/Review');
const WishlistItem = require('../models/WishlistItem');
const Notification = require('../models/Notification');


// @desc    Test admin route (existing)
// @route   GET /api/admin/test
// @access  Private (Admin only)
const testAdminRoute = async (req, res) => {
    res.json({ message: `Welcome, Admin ${req.user.username}! You have access to admin functionalities.` });
};

// @desc    Get all users (for Admin Dashboard) (existing)
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Admin: Error fetching all users:', error);
        res.status(500).json({ message: 'Server error: Could not retrieve users.' });
    }
};

// @desc    Delete a user (and associated data) (existing)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        if (req.user._id.toString() === userIdToDelete) {
            return res.status(400).json({ message: 'Admins cannot delete their own account via admin panel.' });
        }
        const userToDelete = await User.findById(userIdToDelete);
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found.' });
        }
        await Book.deleteMany({ owner: userIdToDelete });
        await ExchangeRequest.deleteMany({ $or: [{ requester: userIdToDelete }, { owner: userIdToDelete }] });
        await Message.deleteMany({ $or: [{ sender: userIdToDelete }, { receiver: userIdToDelete }] });
        await Notification.deleteMany({ $or: [{ recipient: userIdToDelete }, { sender: userIdToDelete }] });
        await Review.deleteMany({ $or: [{ reviewer: userIdToDelete }, { reviewee: userIdToDelete }] });
        await WishlistItem.deleteMany({ user: userIdToDelete });
        await userToDelete.deleteOne();
        res.json({ message: 'User and all associated data removed successfully.' });
    } catch (error) {
        console.error('Admin: Error deleting user:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not delete user.' });
    }
};

// @desc    Get all books (for Admin Dashboard) (existing)
// @route   GET /api/admin/books
// @access  Private (Admin only)
const getAllBooks = async (req, res) => {
    try {
        const books = await Book.find({})
            .populate('owner', 'username email')
            .sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        console.error('Admin: Error fetching all books:', error);
        res.status(500).json({ message: 'Server error: Could not retrieve books.' });
    }
};

// @desc    Delete a book (existing)
// @route   DELETE /api/admin/books/:id
// @access  Private (Admin only)
const deleteBookAdmin = async (req, res) => {
    try {
        const bookIdToDelete = req.params.id;
        const bookToDelete = await Book.findById(bookIdToDelete);
        if (!bookToDelete) {
            return res.status(404).json({ message: 'Book not found.' });
        }
        await WishlistItem.deleteMany({ book: bookIdToDelete });
        await ExchangeRequest.deleteMany({ $or: [{ requestedBook: bookIdToDelete }, { offeredBook: bookIdToDelete }] });
        // This explicitly looks for ExchangeRequests whose _id is *not* already deleted by the above line,
        // and whose message or notification references the book directly
        const relatedExchangeIds = (await ExchangeRequest.find({ $or: [{ requestedBook: bookIdToDelete }, { offeredBook: bookIdToDelete }] }, '_id')).map(e => e._id);
        await Message.deleteMany({ exchangeRequest: { $in: relatedExchangeIds } });
        await Notification.deleteMany({ referenceId: bookIdToDelete, type: { $in: ['exchange_request', 'message', 'status_update'] } }); // Notifications directly related to book being exchanged
        await bookToDelete.deleteOne();
        res.json({ message: 'Book and associated data removed successfully.' });
    } catch (error) {
        console.error('Admin: Error deleting book:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid book ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not delete book.' });
    }
};

// @desc    Get all exchange requests (for Admin Dashboard)
// @route   GET /api/admin/exchanges
// @access  Private (Admin only)
const getAllExchanges = async (req, res) => {
    try {
        // Find all exchanges, populate details for display
        const exchanges = await ExchangeRequest.find({})
            .populate('requester', 'username email')
            .populate('requestedBook', 'title author imageUrl')
            .populate('offeredBook', 'title author imageUrl')
            .populate('owner', 'username email')
            .sort({ createdAt: -1 }); // Newest exchanges first
        res.json(exchanges);
    } catch (error) {
        console.error('Admin: Error fetching all exchanges:', error);
        res.status(500).json({ message: 'Server error: Could not retrieve exchanges.' });
    }
};

// @desc    Update status of an exchange request (Admin action)
// @route   PUT /api/admin/exchanges/:id/status
// @access  Private (Admin only)
const updateExchangeStatusAdmin = async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Accepted', 'Declined', 'Cancelled', 'Completed']; // Admins can set any valid status

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const exchange = await ExchangeRequest.findById(req.params.id)
             .populate('requester', 'username') // Populate for potential notification message
             .populate('owner', 'username')
             .populate('requestedBook', 'title')
             .populate('offeredBook', 'title');

        if (!exchange) {
            return res.status(404).json({ message: 'Exchange request not found.' });
        }

        // Admins can force any valid status directly
        exchange.status = status;

        // --- Handle associated book status changes based on new exchange status ---
        if (status === 'Completed') {
            exchange.completedAt = new Date();
            if (exchange.requestedBook) {
                exchange.requestedBook.availabilityStatus = 'Exchanged';
                await exchange.requestedBook.save();
            }
            if (exchange.offeredBook) {
                exchange.offeredBook.availabilityStatus = 'Exchanged';
                await exchange.offeredBook.save();
            }
            // Invalidate other pending/accepted requests for these books (existing logic, but triggered by admin now)
            await ExchangeRequest.updateMany(
                {
                    _id: { $ne: exchange._id },
                    $or: [
                        { requestedBook: exchange.requestedBook?._id },
                        ...(exchange.offeredBook ? [{ requestedBook: exchange.offeredBook._id }, { offeredBook: exchange.offeredBook._id }] : []),
                        { offeredBook: exchange.requestedBook?._id }
                    ].filter(Boolean), // Filter out null/undefined if offeredBook doesn't exist
                    status: { $in: ['Pending', 'Accepted'] }
                },
                { $set: { status: 'Cancelled' } }
            );
            await Book.updateMany(
                {
                    _id: { $nin: [exchange.requestedBook?._id, exchange.offeredBook?._id].filter(Boolean) },
                    availabilityStatus: 'Pending Exchange'
                },
                { $set: { availabilityStatus: 'Available' } }
            );

        } else if (status === 'Cancelled' || status === 'Declined') {
            // Revert book statuses if they were pending exchange and now cancelled/declined by admin
            if (exchange.requestedBook && exchange.requestedBook.availabilityStatus === 'Pending Exchange') {
                exchange.requestedBook.availabilityStatus = 'Available';
                await exchange.requestedBook.save();
            }
            if (exchange.offeredBook && exchange.offeredBook.availabilityStatus === 'Pending Exchange') {
                exchange.offeredBook.availabilityStatus = 'Available';
                await exchange.offeredBook.save();
            }
            exchange.completedAt = null; // Clear completion date if not completed
        } else if (status === 'Accepted') {
            if (exchange.requestedBook) {
                exchange.requestedBook.availabilityStatus = 'Pending Exchange';
                await exchange.requestedBook.save();
            }
            if (exchange.offeredBook) {
                exchange.offeredBook.availabilityStatus = 'Pending Exchange';
                await exchange.offeredBook.save();
            }
            exchange.completedAt = null;
        } else if (status === 'Pending') {
            // If admin sets back to pending, ensure books are available or pending based on previous context
            // For simplicity, just set to available if not already in pending. More complex logic if needed.
            if (exchange.requestedBook) {
                 if (exchange.requestedBook.availabilityStatus !== 'Pending Exchange' && exchange.requestedBook.availabilityStatus !== 'Available') {
                    exchange.requestedBook.availabilityStatus = 'Available';
                    await exchange.requestedBook.save();
                }
            }
            if (exchange.offeredBook) {
                if (exchange.offeredBook.availabilityStatus !== 'Pending Exchange' && exchange.offeredBook.availabilityStatus !== 'Available') {
                    exchange.offeredBook.availabilityStatus = 'Available';
                    await exchange.offeredBook.save();
                }
            }
            exchange.completedAt = null;
        }


        const updatedExchange = await exchange.save();

        // Optional: Send notification to involved parties about admin status change
        // This requires sending notifications from adminController. We can add this later if needed.

        res.json(updatedExchange);

    } catch (error) {
        console.error('Admin: Error updating exchange status:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid exchange request ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not update exchange status.' });
    }
};


module.exports = {
    testAdminRoute,
    getAllUsers,
    deleteUser,
    getAllBooks,
    deleteBookAdmin,
    getAllExchanges,        // <--- NEW: Export getAllExchanges
    updateExchangeStatusAdmin, // <--- NEW: Export updateExchangeStatusAdmin
};