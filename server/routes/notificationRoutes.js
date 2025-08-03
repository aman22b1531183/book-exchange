// server/routes/notificationRoutes.js
const express = require('express');
const {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getMyNotifications); // Get all notifications
router.get('/unread-count', protect, getUnreadNotificationCount); // Get unread count
router.put('/:id/read', protect, markNotificationAsRead); // Mark a single notification as read
router.put('/mark-all-read', protect, markAllNotificationsAsRead); // Mark all as read

module.exports = router;