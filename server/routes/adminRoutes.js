// server/routes/adminRoutes.js
const express = require('express');
const {
    testAdminRoute,
    getAllUsers,
    deleteUser,
    getAllBooks,
    deleteBookAdmin,
    getAllExchanges, // <--- NEW: Import getAllExchanges
    updateExchangeStatusAdmin, // <--- NEW: Import updateExchangeStatusAdmin
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminAuthMiddleware');

const router = express.Router();

// Test admin route (existing)
router.route('/test').get(protect, adminProtect, testAdminRoute);

// Admin User Management Routes (existing)
router.route('/users')
    .get(protect, adminProtect, getAllUsers);
router.route('/users/:id')
    .delete(protect, adminProtect, deleteUser);

// Admin Book Management Routes (existing)
router.route('/books')
    .get(protect, adminProtect, getAllBooks);
router.route('/books/:id')
    .delete(protect, adminProtect, deleteBookAdmin);

// Admin Exchange Management Routes
router.route('/exchanges')
    .get(protect, adminProtect, getAllExchanges); // <--- NEW ROUTE: Get all exchanges

router.route('/exchanges/:id/status')
    .put(protect, adminProtect, updateExchangeStatusAdmin); // <--- NEW ROUTE: Update exchange status

module.exports = router;