// frontend/src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext'; // To get the user token for authenticated sockets
import { toast } from 'react-toastify'; // <--- IMPORT TOAST

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated, token } = useAuth(); // Get auth state from AuthContext
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Only connect if the user is authenticated and a token exists
        if (isAuthenticated && token && user) { // Ensure user object is also available
            // Connect to your backend Socket.IO server
            // Ensure this URL matches your backend server's URL
            const newSocket = io('http://localhost:5000', {
                auth: {
                    token: token, // Pass the JWT token for potential authentication on socket connection
                },
            });

            newSocket.on('connect', () => {
                console.log('Socket Connected:', newSocket.id);
                setIsConnected(true);
                // Immediately join the user-specific room upon connection
                // This room is named after the user's MongoDB _id
                newSocket.emit('joinUserRoom', user._id);
                console.log(`Socket ${newSocket.id} joined user room: ${user._id}`);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket Disconnected:', newSocket.id);
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket Connection Error:', err.message);
                setIsConnected(false);
                toast.error(`Socket connection error: ${err.message}`); // Notify user of connection issues
            });

            // --- NEW: Listen for 'newNotification' event ---
            newSocket.on('newNotification', (notification) => {
                console.log('New real-time notification received:', notification);
                // Display a toast notification
                toast.info(notification.message, {
                    onClick: () => {
                        // Optionally, you can add navigation logic here when the toast is clicked.
                        // For example, navigate to the exchange details page for exchange-related notifications.
                        // You would need 'navigate' from react-router-dom, which isn't directly
                        // available in context. A common pattern is to dispatch an action or
                        // use window.location.href, or to handle navigation directly in the NotificationPage.
                        // For now, it just displays.
                        if (notification.type === 'exchange_request' || notification.type === 'status_update' || notification.type === 'message') {
                            // Example of direct navigation (consider using useNavigate hook from a component if possible)
                            // window.location.href = `/exchanges/${notification.referenceId}`;
                        }
                    },
                    // Optional: Keep toast open longer for important notifications
                    autoClose: notification.type === 'message' || notification.type === 'exchange_request' ? 8000 : 5000,
                });
            });

            setSocket(newSocket);

            // Clean up the socket connection when the component unmounts or user logs out
            return () => {
                newSocket.off('connect');
                newSocket.off('disconnect');
                newSocket.off('connect_error');
                newSocket.off('newNotification'); // Clean up notification listener
                newSocket.disconnect();
                setSocket(null);
                setIsConnected(false);
            };
        } else if (!isAuthenticated && socket) {
            // If user logs out and socket is still connected, disconnect it
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    }, [isAuthenticated, token, user]); // Re-run effect if auth state changes

    const contextValue = {
        socket,
        isConnected,
    };

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};

// Custom hook to easily use the socket anywhere in the app
export const useSocket = () => {
    return useContext(SocketContext);
};