// server/routes/authRoutes.js
const express = require('express');
const { registerUser, loginUser, getUserProfile, updateUserProfile, getUserProfileById } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Assuming this is still used

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser); // <--- THIS ROUTE MUST BE PRESENT
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, upload.single('profileImage'), updateUserProfile);
router.get('/profile/:id', getUserProfileById);

module.exports = router;