// server/utils/notificationEmitter.js
const Notification = require('../models/Notification'); // Import the Notification model
let ioInstance; // To hold the Socket.IO instance

// Function to set the Socket.IO instance once it's available (from server.js)
const setIoInstance = (io) => {
    ioInstance = io;
};

// Function to create, save, and emit a notification
const createAndEmitNotification = async ({ recipientId, senderId, type, referenceId, message }) => {
    try {
        const newNotification = new Notification({
            recipient: recipientId,
            sender: senderId,
            type,
            referenceId,
            message,
            isRead: false,
        });

        const savedNotification = await newNotification.save();

        // Populate sender if needed for the real-time payload
        await savedNotification.populate('sender', 'username profilePictureUrl');

        // Emit the notification via Socket.IO
        if (ioInstance) {
            // Emit to a specific user's room (we'll make users join rooms based on their ID later)
            ioInstance.to(recipientId.toString()).emit('newNotification', savedNotification);
            console.log(`Notification emitted to user ${recipientId}: ${message}`);
        } else {
            console.warn('Socket.IO instance not set in notificationEmitter. Notification not emitted in real-time.');
        }

        return savedNotification;
    } catch (error) {
        console.error('Error creating or emitting notification:', error);
        throw new Error('Could not create or emit notification');
    }
};

module.exports = {
    setIoInstance,
    createAndEmitNotification,
};