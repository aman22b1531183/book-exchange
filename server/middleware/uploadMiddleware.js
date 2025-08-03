// server/middleware/uploadMiddleware.js
const multer = require('multer');

// Configure Multer to store files in memory as a Buffer
const storage = multer.memoryStorage();

// Define a file filter to ensure only image files are uploaded
const fileFilter = (req, file, cb) => {
    // Check if the mimetype starts with 'image/'
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Accept the file
    } else {
        // Reject the file and provide an error message
        cb(new Error('Only image files (JPEG, PNG, GIF, etc.) are allowed!'), false);
    }
};

// Initialize Multer upload middleware
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Set a file size limit of 5 MB (5 * 1024 * 1024 bytes)
    }
});

module.exports = upload;