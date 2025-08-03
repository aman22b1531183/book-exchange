// server/controllers/messageController.js
const Message = require('../models/Message');
const ExchangeRequest = require('../models/ExchangeRequest');
const User = require('../models/User'); // Assuming User model is needed for populating in future
const { createAndEmitNotification } = require('../utils/notificationEmitter'); // Import notification emitter

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    const { receiverId, exchangeRequestId, content } = req.body;
    const senderId = req.user._id; // The logged-in user is the sender

    // Basic validation
    if (!receiverId || !exchangeRequestId || !content) {
        return res.status(400).json({ message: 'Please provide receiver, exchange request, and message content.' });
    }
    if (senderId.toString() === receiverId.toString()) {
        return res.status(400).json({ message: 'You cannot send a message to yourself.' });
    }

    try {
        // 1. Verify the exchange request exists
        const exchangeRequest = await ExchangeRequest.findById(exchangeRequestId).populate('requestedBook', 'title'); // Populate requestedBook for notification message
        if (!exchangeRequest) {
            return res.status(404).json({ message: 'Exchange request not found.' });
        }

        // 2. Verify sender is part of the exchange
        const isSenderInvolved = (exchangeRequest.requester.toString() === senderId.toString()) ||
                                 (exchangeRequest.owner.toString() === senderId.toString());
        if (!isSenderInvolved) {
            return res.status(403).json({ message: 'You are not part of this exchange conversation.' });
        }

        // 3. Verify receiver is the OTHER party in the exchange
        let actualReceiverId;
        if (exchangeRequest.requester.toString() === senderId.toString()) {
            actualReceiverId = exchangeRequest.owner; // If sender is requester, receiver must be owner
        } else if (exchangeRequest.owner.toString() === senderId.toString()) {
            actualReceiverId = exchangeRequest.requester; // If sender is owner, receiver must be requester
        } else {
            return res.status(403).json({ message: 'You are not authorized to send messages in this exchange.' });
        }

        if (actualReceiverId.toString() !== receiverId.toString()) {
            return res.status(400).json({ message: 'Invalid receiver for this exchange conversation.' });
        }

        // 4. Create and save the message
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            exchangeRequest: exchangeRequestId,
            content,
            isRead: false, // Mark as unread for the receiver by default
        });

        const createdMessage = await newMessage.save();
        console.log('Message saved to DB:', createdMessage); // <--- ADDED LOG

        // --- NEW: Emit notification for the message receiver ---
        const senderUsername = req.user.username; // Get sender's username from authenticated user
        await createAndEmitNotification({
            recipientId: actualReceiverId, // The other party in the chat
            senderId: senderId,
            type: 'message',
            referenceId: exchangeRequestId, // Link to the exchange request
            message: `${senderUsername} sent you a message in the exchange for "${exchangeRequest.requestedBook.title}".`
        });

        res.status(201).json(createdMessage);

    } catch (error) {
        console.error('Error sending message:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format for receiver or exchange request.' });
        }
        res.status(500).json({ message: 'Server error: Could not send message.' });
    }
};

// @desc    Get messages for a specific exchange request
// @route   GET /api/messages/:exchangeRequestId
// @access  Private
const getExchangeMessages = async (req, res) => {
    const { exchangeRequestId } = req.params;
    const userId = req.user._id; // The logged-in user

    console.log(`Fetching messages for exchange: ${exchangeRequestId} by user: ${userId}`); // <--- ADDED LOG

    try {
        // 1. Verify the exchange request exists
        const exchangeRequest = await ExchangeRequest.findById(exchangeRequestId);
        if (!exchangeRequest) {
            return res.status(404).json({ message: 'Exchange request not found.' });
        }

        // 2. Ensure the logged-in user is involved in this exchange conversation
        const isUserInvolved = (exchangeRequest.requester.toString() === userId.toString()) ||
                               (exchangeRequest.owner.toString() === userId.toString());
        if (!isUserInvolved) {
            return res.status(403).json({ message: 'Not authorized to view messages for this exchange.' });
        }

        // 3. Fetch messages for the exchange request, populate sender/receiver for display
        const messages = await Message.find({ exchangeRequest: exchangeRequestId })
            .populate('sender', 'username') // Only populate username from sender
            .populate('receiver', 'username') // Only populate username from receiver
            .sort({ createdAt: 1 }); // Sort by creation date ascending (oldest first)

        console.log('Fetched messages:', messages); // <--- ADDED LOG

        // 4. Optionally: Mark messages as read for the current user
        await Message.updateMany(
            { exchangeRequest: exchangeRequestId, receiver: userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.json(messages);

    } catch (error) {
        console.error('Error fetching exchange messages:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid exchange request ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not retrieve messages.' });
    }
};

// @desc    Get count of unread messages for the logged-in user
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadMessageCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const unreadCount = await Message.countDocuments({ receiver: userId, isRead: false });
        res.json({ count: unreadCount });
    } catch (error) {
        console.error('Error fetching unread message count:', error);
        res.status(500).json({ message: 'Server error: Could not retrieve unread message count.' });
    }
};


module.exports = {
    sendMessage,
    getExchangeMessages,
    getUnreadMessageCount,
};