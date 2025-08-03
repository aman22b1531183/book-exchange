// server/routes/exchangeRoutes.js
const express = require('express');
const {
    createExchangeRequest,
    getMyExchangeRequests,
    getExchangeRequestById,
    updateExchangeRequestStatus,
} = require('../controllers/exchangeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createExchangeRequest); // Create a new exchange request
router.get('/myrequests', protect, getMyExchangeRequests); // Get all requests for the logged-in user
router.get('/:id', protect, getExchangeRequestById); // Get a specific exchange request by ID
router.put('/:id/status', protect, updateExchangeRequestStatus); // Update status of an exchange request

module.exports = router;