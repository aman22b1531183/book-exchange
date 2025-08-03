// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext'; // Import SocketProvider
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router } from 'react-router-dom'; // <-- IMPORTANT: Ensure this is imported

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router> {/* This MUST be the outermost wrapper for routing to work */}
      <AuthProvider> {/* AuthProvider provides user/token */}
        <SocketProvider> {/* SocketProvider uses AuthProvider's context */}
          <App />
        </SocketProvider>
      </AuthProvider>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
    </Router>
  </React.StrictMode>
);