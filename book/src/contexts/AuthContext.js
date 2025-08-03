// frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react'; // Removed useRef
import axios from 'axios';
import { toast } from 'react-toastify';
// REMOVED: import io from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    console.log('--- AuthProvider: RENDER ---');
    const [user, setUser] = useState(() => {
        console.log('AuthProvider: user state init');
        return null;
    });
    const [loading, setLoading] = useState(() => {
        console.log('AuthProvider: loading state init');
        return true;
    });

    // REMOVED: const socket = useRef(null);

    // REMOVED: useEffect for Socket.IO connection handling
    /*
    useEffect(() => {
        if (user && user.token && !socket.current) {
            // ... socket.io connection logic ...
        } else if (!user && socket.current) {
            // ... socket disconnect logic ...
        }
        return () => {
            if (socket.current) {
                // ... socket cleanup ...
            }
        };
    }, [user]);
    */

    // Initial load user from localStorage (existing code)
    useEffect(() => {
        console.log('AuthProvider: useEffect triggered (initial load user)');
        const loadUser = () => {
            try {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    console.log('AuthProvider: Found userInfo in localStorage');
                    const parsedUserInfo = JSON.parse(userInfo);
                    setUser(parsedUserInfo);
                } else {
                    console.log('AuthProvider: No userInfo in localStorage');
                }
            } catch (error) {
                console.error("AuthProvider: Failed to parse user info from localStorage:", error);
                localStorage.removeItem('userInfo');
                setUser(null);
            } finally {
                setLoading(false);
                console.log('AuthProvider: setLoading(false)');
            }
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        console.log('AuthProvider: login called');
        try {
            const { data } = await axios.post('/api/auth/login', { email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            toast.success('Login successful!');
            return true;
        } catch (error) {
            console.error('AuthProvider: Login error:', error);
            const errorMessage = error.response && error.response.data.message ? error.response.data.message : error.message;
            toast.error(errorMessage);
            return false;
        }
    };

    const register = async (username, email, password) => {
        console.log('AuthProvider: register called');
        try {
            const { data } = await axios.post('/api/auth/register', { username, email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            toast.success('Registration successful! Logged in automatically.');
            return true;
        } catch (error) {
            console.error('AuthProvider: Register error:', error);
            const errorMessage = error.response && error.response.data.message ? error.response.data.message : error.message;
            toast.error(errorMessage);
            return false;
        }
    };

    const logout = () => {
        console.log('AuthProvider: logout called');
        localStorage.removeItem('userInfo');
        setUser(null);
        toast.info('Logged out.');
    };

    const updateUserInContext = (updatedUserData) => {
        console.log('AuthProvider: updateUserInContext called with:', updatedUserData);
        const currentInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
        const newInfo = { ...currentInfo, ...updatedUserData };
        localStorage.setItem('userInfo', JSON.stringify(newInfo));
        setUser(newInfo);
    };

    const authContextValue = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !loading,
        token: user ? user.token : null,
        updateUserInContext,
        // REMOVED: socket: socket.current
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};