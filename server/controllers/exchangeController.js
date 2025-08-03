// server/controllers/exchangeController.js
const ExchangeRequest = require('../models/ExchangeRequest');
const Book = require('../models/Book'); // Needed to update book statuses
const { createAndEmitNotification } = require('../utils/notificationEmitter'); // Import notification emitter

// @desc    Create a new exchange request
// @route   POST /api/exchanges
// @access  Private
const createExchangeRequest = async (req, res) => {
    const { requestedBookId, offeredBookId, requestMessage } = req.body;
    const requesterId = req.user._id; // ID of the user initiating the request

    try {
        const requestedBook = await Book.findById(requestedBookId);

        if (!requestedBook) {
            return res.status(404).json({ message: 'Requested book not found.' });
        }

        // Prevent requesting your own book
        if (requestedBook.owner.toString() === requesterId.toString()) {
            return res.status(400).json({ message: 'You cannot request your own book.' });
        }

        // Ensure the requested book is available
        if (requestedBook.availabilityStatus !== 'Available') {
            return res.status(400).json({ message: 'The requested book is currently not available for exchange.' });
        }

        // If an offered book is provided, validate it
        let offeredBook = null;
        if (offeredBookId) {
            offeredBook = await Book.findById(offeredBookId);
            if (!offeredBook) {
                return res.status(404).json({ message: 'Offered book not found.' });
            }
            // Ensure the offered book belongs to the requester
            if (offeredBook.owner.toString() !== requesterId.toString()) {
                return res.status(400).json({ message: 'The offered book does not belong to you.' });
            }
            // Ensure the offered book is also available
            if (offeredBook.availabilityStatus !== 'Available') {
                return res.status(400).json({ message: 'Your offered book is not available for exchange.' });
            }
        }

        // Prevent duplicate pending or accepted requests between the same requester and requested book
        const existingRequest = await ExchangeRequest.findOne({
            requester: requesterId,
            requestedBook: requestedBookId,
            status: { $in: ['Pending', 'Accepted'] } // Look for active requests
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'An active exchange request for this book already exists from you.' });
        }

        const exchangeRequest = new ExchangeRequest({
            requester: requesterId,
            requestedBook: requestedBookId,
            offeredBook: offeredBookId, // Will be null if not provided
            owner: requestedBook.owner, // The owner of the book being requested
            requestMessage,
        });

        const createdRequest = await exchangeRequest.save();

        // --- NEW: Emit notification for the book owner ---
        await createAndEmitNotification({
            recipientId: requestedBook.owner, // Notify the owner of the requested book
            senderId: requesterId, // The user who made the request
            type: 'exchange_request',
            referenceId: createdRequest._id,
            message: `${req.user.username} has sent an exchange request for your book "${requestedBook.title}"!`
        });


        res.status(201).json(createdRequest);
    } catch (error) {
        console.error('Error creating exchange request:', error);
        res.status(500).json({ message: 'Server error: Could not create exchange request.' });
    }
};

// @desc    Get all exchange requests for the logged-in user (both sent and received)
// @route   GET /api/exchanges/myrequests
// @access  Private
const getMyExchangeRequests = async (req, res) => {
    console.log('GET /api/exchanges/myrequests hit!'); // <--- ADDED LOG
    console.log('User ID for exchanges:', req.user ? req.user._id : 'User ID not found'); // <--- ADDED LOG

    try {
        const userId = req.user._id;

        // Get requests where the logged-in user is the requester
        const sentRequests = await ExchangeRequest.find({ requester: userId })
            .populate('requestedBook', 'title author imageUrl') // Populate requested book details
            .populate('offeredBook', 'title author imageUrl')   // Populate offered book details
            .populate('owner', 'username email');               // Populate owner of the requested book

        // Get requests where the logged-in user is the owner (recipient of the request)
        const receivedRequests = await ExchangeRequest.find({ owner: userId })
            .populate('requestedBook', 'title author imageUrl')
            .populate('offeredBook', 'title author imageUrl')
            .populate('requester', 'username email');           // Populate the requester's details

        console.log('Sent Requests Count:', sentRequests.length);    // <--- ADDED LOG
        console.log('Received Requests Count:', receivedRequests.length); // <--- ADDED LOG

        res.json({ sentRequests, receivedRequests });
    } catch (error) {
        console.error('Error fetching my exchange requests:', error);
        res.status(500).json({ message: 'Server error: Could not retrieve exchange requests.' });
    }
};

// @desc    Get a single exchange request by ID
// @route   GET /api/exchanges/:id
// @access  Private (only involved parties can view)
const getExchangeRequestById = async (req, res) => {
    try {
        const request = await ExchangeRequest.findById(req.params.id)
            .populate('requester', 'username email')
            .populate('requestedBook', 'title author imageUrl owner') // owner populated for access check
            .populate('offeredBook', 'title author imageUrl')
            .populate('owner', 'username email'); // Explicitly populate the 'owner' field of the request

        if (!request) {
            return res.status(404).json({ message: 'Exchange request not found.' });
        }

        // Ensure the logged-in user is either the requester or the owner of the requested book
        if (request.requester._id.toString() !== req.user._id.toString() &&
            request.owner._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this request.' });
        }

        res.json(request);
    } catch (error) {
        console.error('Error fetching single exchange request:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid exchange request ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not retrieve exchange request.' });
    }
};

// @desc    Update status of an exchange request (Accept/Decline/Cancel/Complete)
// @route   PUT /api/exchanges/:id/status
// @access  Private
const updateExchangeRequestStatus = async (req, res) => {
    const { status } = req.body; // Expected status: 'Accepted', 'Declined', 'Cancelled', 'Completed'
    const validStatuses = ['Accepted', 'Declined', 'Cancelled', 'Completed'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        // Populate books to check their current status and owners
        const request = await ExchangeRequest.findById(req.params.id)
            .populate('requester', 'username') // Populate to get username for notification
            .populate('owner', 'username')     // Populate to get username for notification
            .populate('requestedBook', 'title') // Populate for notification message
            .populate('offeredBook', 'title');  // Populate for notification message

        if (!request) {
            return res.status(404).json({ message: 'Exchange request not found.' });
        }

        const loggedInUserId = req.user._id.toString();
        const requesterId = request.requester._id.toString();
        const ownerOfRequestedBookId = request.owner._id.toString();

        let notificationMessage = '';
        let recipientToNotify = null; // Who should get the notification about the status change

        if (status === 'Accepted') {
            // Only the owner of the requested book can accept
            if (ownerOfRequestedBookId !== loggedInUserId) {
                return res.status(403).json({ message: 'Not authorized to accept this request.' });
            }
            if (request.status !== 'Pending') {
                return res.status(400).json({ message: `Request is already ${request.status}. Cannot accept.` });
            }

            request.status = 'Accepted';
            // Mark requested book as pending for its owner's side
            request.requestedBook.availabilityStatus = 'Pending Exchange';
            await request.requestedBook.save();

            // If an offered book exists, mark it as pending for the requester's side
            if (request.offeredBook) {
                request.offeredBook.availabilityStatus = 'Pending Exchange';
                await request.offeredBook.save();
            }
            notificationMessage = `${request.owner.username} has accepted your exchange request for "${request.requestedBook.title}"!`;
            recipientToNotify = requesterId; // Notify the requester

        } else if (status === 'Declined') {
            // Only the owner of the requested book can decline
            if (ownerOfRequestedBookId !== loggedInUserId) {
                return res.status(403).json({ message: 'Not authorized to decline this request.' });
            }
            if (request.status !== 'Pending') {
                return res.status(400).json({ message: `Request is already ${request.status}. Cannot decline.` });
            }

            request.status = 'Declined';
            notificationMessage = `${request.owner.username} has declined your exchange request for "${request.requestedBook.title}".`;
            recipientToNotify = requesterId; // Notify the requester

        } else if (status === 'Cancelled') {
            // Either requester or owner can cancel, as long as it's not completed or already declined
            if (requesterId !== loggedInUserId && ownerOfRequestedBookId !== loggedInUserId) {
                return res.status(403).json({ message: 'Not authorized to cancel this request.' });
            }
            if (request.status === 'Completed' || request.status === 'Declined') {
                return res.status(400).json({ message: `Request is already ${request.status}. Cannot cancel.` });
            }

            request.status = 'Cancelled';
            // If books were marked 'Pending Exchange', revert them to 'Available'
            if (request.requestedBook.availabilityStatus === 'Pending Exchange') {
                request.requestedBook.availabilityStatus = 'Available';
                await request.requestedBook.save();
            }
            if (request.offeredBook && request.offeredBook.availabilityStatus === 'Pending Exchange') {
                request.offeredBook.availabilityStatus = 'Available';
                await request.offeredBook.save();
            }
            // Notify the other party involved in the exchange
            if (loggedInUserId === requesterId) { // If requester cancelled, notify owner
                notificationMessage = `${request.requester.username} has cancelled the exchange request for "${request.requestedBook.title}".`;
                recipientToNotify = ownerOfRequestedBookId;
            } else { // If owner cancelled, notify requester
                notificationMessage = `${request.owner.username} has cancelled the exchange request for "${request.requestedBook.title}".`;
                recipientToNotify = requesterId;
            }

        } else if (status === 'Completed') {
            // Either party can mark as completed AFTER it's been accepted
            if (requesterId !== loggedInUserId && ownerOfRequestedBookId !== loggedInUserId) {
                return res.status(403).json({ message: 'Not authorized to complete this request.' });
            }
            if (request.status !== 'Accepted') {
                return res.status(400).json({ message: 'Request must be "Accepted" before it can be "Completed".' });
            }

            request.status = 'Completed';
            request.completedAt = new Date(); // Set completion timestamp

            // Mark both books as 'Exchanged'
            request.requestedBook.availabilityStatus = 'Exchanged';
            await request.requestedBook.save();
            if (request.offeredBook) {
                request.offeredBook.availabilityStatus = 'Exchanged';
                await request.offeredBook.save();
            }

            // Important: Handle other pending/accepted requests for these now-exchanged books
            // Find and cancel any other 'Pending' or 'Accepted' requests for these books
            // This prevents multiple exchanges for the same physical book
            await ExchangeRequest.updateMany(
                {
                    _id: { $ne: request._id }, // Exclude the current request
                    $or: [
                        { requestedBook: request.requestedBook._id },
                        // If there was an offered book in this exchange, also check for it
                        ...(request.offeredBook ? [{ requestedBook: request.offeredBook._id }, { offeredBook: request.offeredBook._id }] : []),
                        { offeredBook: request.requestedBook._id } // Also if this book was offered in another exchange
                    ],
                    status: { $in: ['Pending', 'Accepted'] }
                },
                { $set: { status: 'Cancelled' } } // Mark them as cancelled
            );

            // Revert availability of books that were part of now-cancelled requests back to 'Available'
            await Book.updateMany(
                {
                    _id: { $nin: [request.requestedBook._id, request.offeredBook ? request.offeredBook._id : null].filter(Boolean) }, // Exclude the two books that were just exchanged
                    availabilityStatus: 'Pending Exchange' // Only revert if they were pending
                },
                { $set: { availabilityStatus: 'Available' } }
            );

            // Notify the other party that the exchange is completed
            if (loggedInUserId === requesterId) { // If requester completed, notify owner
                notificationMessage = `Exchange for "${request.requestedBook.title}" marked as completed by ${request.requester.username}!`;
                recipientToNotify = ownerOfRequestedBookId;
            } else { // If owner completed, notify requester
                notificationMessage = `Exchange for "${request.requestedBook.title}" marked as completed by ${request.owner.username}!`;
                recipientToNotify = requesterId;
            }

        } else {
            // Should not reach here due to initial validStatuses check, but for safety:
            return res.status(400).json({ message: 'Unhandled status transition.' });
        }

        const updatedRequest = await request.save();

        // --- NEW: Emit notification for status update ---
        if (recipientToNotify) {
            await createAndEmitNotification({
                recipientId: recipientToNotify,
                senderId: req.user._id, // The user who triggered the status change
                type: 'status_update',
                referenceId: updatedRequest._id,
                message: notificationMessage
            });
        }

        res.json(updatedRequest);

    } catch (error) {
        console.error('Error updating exchange request status:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid exchange request ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not update exchange request status.' });
    }
};

module.exports = {
    createExchangeRequest,
    getMyExchangeRequests,
    getExchangeRequestById,
    updateExchangeRequestStatus,
};