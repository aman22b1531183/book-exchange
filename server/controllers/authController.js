// server/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { uploadToCloudinary } = require('../utils/cloudinary'); // Import Cloudinary util

// Helper function to generate a JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    // Simple validation (more robust validation should be added)
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // Check if user already exists by email or username
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        // Create new user (password will be hashed by pre-save hook in User model)
        const user = await User.create({
            username,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id), // Send back a JWT token
                // When a new user registers, they won't have these yet unless default is set in model
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                profilePictureUrl: user.profilePictureUrl || 'https://via.placeholder.com/150',
                isAdmin: user.isAdmin, // Include isAdmin
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Error in registerUser:', error.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter email and password' });
    }

    try {
        // Find user by email. Make sure to fetch all relevant profile fields here.
        const user = await User.findOne({ email });

        // Check if user exists and password matches
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                profilePictureUrl: user.profilePictureUrl || 'https://via.placeholder.com/150',
                isAdmin: user.isAdmin, // Include isAdmin
                token: generateToken(user._id), // Send back a JWT token
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error in loginUser:', error.message);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc    Get user profile (for logged-in user)
// @route   GET /api/auth/profile
// @access  Private (requires token)
const getUserProfile = async (req, res) => {
    // req.user is populated by the 'protect' middleware based on the JWT
    const user = await User.findById(req.user._id).select('-password'); // Exclude password field

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            zipCode: user.zipCode || '',
            profilePictureUrl: user.profilePictureUrl || 'https://via.placeholder.com/150', // Fallback to a common placeholder
            isAdmin: user.isAdmin, // Include isAdmin
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile (isAdmin is not updated via this route)
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.username = req.body.username !== undefined ? req.body.username : user.username;
        user.email = req.body.email !== undefined ? req.body.email : user.email;

        // Update optional profile fields if provided
        user.firstName = req.body.firstName !== undefined ? req.body.firstName : user.firstName;
        user.lastName = req.body.lastName !== undefined ? req.body.lastName : user.lastName;
        user.address = req.body.address !== undefined ? req.body.address : user.address;
        user.city = req.body.city !== undefined ? req.body.city : user.city;
        user.state = req.body.state !== undefined ? req.body.state : user.state;
        user.zipCode = req.body.zipCode !== undefined ? req.body.zipCode : user.zipCode;

        let newProfilePictureUrl = user.profilePictureUrl; // Start with current URL

        if (req.file) { // If a new profile image file was uploaded
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: 'book-exchange-profiles', // Specific folder for profile pictures
                resource_type: 'image',
            });
            newProfilePictureUrl = result.secure_url;
        } else if (req.body.profilePictureUrl !== undefined) {
            newProfilePictureUrl = req.body.profilePictureUrl === ''
                ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwM_ABMwdQL7Zb4rLmaMl964QE9D4J20TA3w&s' // Fallback if cleared
                : req.body.profilePictureUrl;
        }

        user.profilePictureUrl = newProfilePictureUrl; // Assign the determined URL

        // Handle password update separately and carefully
        if (req.body.password) {
            if (req.body.password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters' });
            }
            user.password = req.body.password; // FIX: Assign the new password
        }

        // Check for duplicate email or username (existing logic)
        if (req.body.email && req.body.email !== user.email) {
            const existingUser = await User.findOne({ email: req.body.email });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }
        if (req.body.username && req.body.username !== user.username) {
            const existingUser = await User.findOne({ username: req.body.username });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Username already taken' });
            }
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            address: updatedUser.address,
            city: updatedUser.city,
            state: updatedUser.state,
            zipCode: updatedUser.zipCode,
            profilePictureUrl: updatedUser.profilePictureUrl,
            isAdmin: updatedUser.isAdmin,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get user profile by ID
// @route   GET /api/auth/profile/:id
// @access  Public (or Private if you want to restrict viewing other profiles)
const getUserProfileById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password'); // Exclude password field

        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                address: user.address || '',
                city: user.city || '',
                state: user.state || '',
                zipCode: user.zipCode || '',
                profilePictureUrl: user.profilePictureUrl || 'https://via.placeholder.com/150', // Fallback to a common placeholder
                isAdmin: user.isAdmin,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user profile by ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }
        res.status(500).json({ message: 'Server error: Could not retrieve user profile.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    getUserProfileById,
};