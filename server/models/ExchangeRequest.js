// server/models/ExchangeRequest.js
const mongoose = require('mongoose');

const exchangeRequestSchema = new mongoose.Schema({
    requester: { // The user who initiates the exchange request
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    requestedBook: { // The book the requester WANTS from another user
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
    },
    offeredBook: { // The book the requester OFFERS IN RETURN (optional, for direct swaps)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        default: null, // Can be null if it's a "one-way" request (e.g., just asking, or for discussion)
    },
    owner: { // The owner of the 'requestedBook' (the recipient of the request)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Declined', 'Cancelled', 'Completed'],
        default: 'Pending',
    },
    requestMessage: { // An optional message from the requester
        type: String,
        trim: true,
    },
    completedAt: { // Timestamp for when the exchange was marked 'Completed'
        type: Date,
        default: null,
    },
}, {
    timestamps: true, // Adds `createdAt` and `updatedAt`
});

const ExchangeRequest = mongoose.model('ExchangeRequest', exchangeRequestSchema);
module.exports = ExchangeRequest;