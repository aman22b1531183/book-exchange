// server/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { // The user who should receive this notification
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sender: { // The user who triggered the notification (e.g., sent a message, made a request)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Not all notifications might have a direct sender (e.g., system alerts)
    },
    type: { // Type of notification (e.g., 'exchange_request', 'message', 'status_update')
        type: String,
        required: true,
        enum: ['exchange_request', 'message', 'status_update', 'system_alert', 'review'], // Add more as needed
    },
    // Reference to the related entity (e.g., ExchangeRequest ID, Book ID)
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // You can make this conditional based on type or use different refs if needed
        // For simplicity, we'll use a generic ObjectId for now.
    },
    message: { // The actual notification message to display
        type: String,
        required: true,
        trim: true,
    },
    isRead: { // Whether the notification has been read by the recipient
        type: Boolean,
        default: false,
    },
    readAt: { // Timestamp when the notification was read
        type: Date,
        default: null,
    },
}, {
    timestamps: true, // Adds `createdAt` and `updatedAt`
});

// Add an index for efficient fetching of recipient's unread notifications
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;