// server/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    exchangeRequest: { // Links the message to a specific exchange conversation
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExchangeRequest',
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    isRead: { // To track if the message has been read by the receiver
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true, // Adds `createdAt` (sentAt) and `updatedAt`
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;