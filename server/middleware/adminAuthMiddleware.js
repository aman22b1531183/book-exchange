// server/middleware/adminAuthMiddleware.js
const adminProtect = (req, res, next) => {
    // req.user is populated by the 'protect' middleware (which comes before this one)
    if (req.user && req.user.isAdmin) {
        next(); // User is authenticated and is an admin, proceed
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' }); // Forbidden
    }
};

module.exports = { adminProtect };