// server/controllers/notificationController.js
const Notification = require('../models/Notification');
const User = require('../models/User'); // Assuming User model is needed for population

// @desc    Get all notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate('sender', 'username profilePictureUrl') // Populate sender details
            .sort({ createdAt: -1 }); // Sort by newest first

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error: Could not retrieve notifications.' });
    }
};

// @desc    Get count of unread notifications for the logged-in user
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadNotificationCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        res.status(500).json({ message: 'Server error: Could not retrieve unread notification count.' });
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        // Ensure the logged-in user is the recipient of this notification
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to mark this notification as read.' });
        }

        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();
            await notification.save();
        }

        res.json({ message: 'Notification marked as read.', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid notification ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not mark notification as read.' });
    }
};

// @desc    Mark all notifications as read for the logged-in user
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error: Could not mark all notifications as read.' });
    }
};


module.exports = {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
};