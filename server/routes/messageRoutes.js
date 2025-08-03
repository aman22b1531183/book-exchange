// server/routes/messageRoutes.js
const express = require('express');
const {
    sendMessage,
    getExchangeMessages,
    getUnreadMessageCount,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, sendMessage); // Send a new message
router.get('/unread-count', protect, getUnreadMessageCount); // Get unread count for the user
router.get('/:exchangeRequestId', protect, getExchangeMessages); // Get all messages for a specific exchange

module.exports = router;