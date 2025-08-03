// frontend/src/components/Footer.js
import React from 'react';
import './Footer.css'; // Import Footer.css

function Footer() {
    return (
        <footer className="footer"> {/* Use .footer class */}
            <p>&copy; {new Date().getFullYear()} Book Exchange Platform</p>
        </footer>
    );
}

export default Footer;