import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from "react-router-dom";

export const AppContext = createContext()

const AppContextProvider = (props) => {
    const [showLogin, setShowLogin] = useState(false)
    const [token, setToken] = useState(() => {
        const savedToken = localStorage.getItem('token')
        console.log('Initial token from localStorage:', savedToken)
        return savedToken || null
    })
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user')
            console.log('Initial user from localStorage:', savedUser)
            return savedUser ? JSON.parse(savedUser) : null
        } catch (error) {
            console.error('Error parsing user from localStorage:', error)
            return null
        }
    })
    const [credit, setCredit] = useState(0)
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [generatedImage, setGeneratedImage] = useState(null)

    const loadCreditsData = async () => {
        try {
            if (!token) {
                console.log('No token available for loading credits');
                return;
            }

            console.log('Loading credits with token:', token);
            const { data } = await axios.get(backendUrl + '/api/user/credits', { 
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                } 
            })
            
            if (data.success) {
                console.log('Credits loaded successfully:', data);
                setCredit(data.credits)
                setUser(data.user)
                // Store user data in localStorage
                try {
                    localStorage.setItem('user', JSON.stringify(data.user))
                    console.log('User data saved to localStorage:', data.user)
                } catch (error) {
                    console.error('Error saving user to localStorage:', error)
                }
            } else {
                console.log('Failed to load credits:', data);
                // If credits load fails, clear the invalid token
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                setToken(null)
                setUser(null)
                toast.error('Session expired. Please login again.')
            }
        } catch (error) {
            console.error('Error loading credits:', error);
            // If there's an error, clear the invalid token
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setToken(null)
            setUser(null)
            toast.error('Session expired. Please login again.')
        }
    }

    const generateImage = async (prompt) => {
        try {
            setLoading(true);
            setError(null);

            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please login to generate images');
                setLoading(false);
                return;
            }

            const response = await fetch(`${backendUrl}/api/image/generate-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error generating image');
            }

            if (data.success && data.image) {
                setGeneratedImage(data.image);
                // Refresh credits after successful generation
                await loadCreditsData();
                return data.image;
            } else {
                throw new Error(data.message || 'Error generating image');
            }
        } catch (error) {
            console.error('Image generation error:', error);
            setError(error.message || 'Error generating image');
            toast.error(error.message || 'Error generating image');
            throw error;
        } finally {
            setLoading(false);
        }
    }

    const logout = () => {
        console.log('Logging out, clearing token and user data')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
        setCredit(0)
    }

    // Verify token and load user data on mount
    useEffect(() => {
        const verifyToken = async () => {
            console.log('Verifying token:', token)
            if (token) {
                console.log('Token found, verifying...');
                try {
                    await loadCreditsData();
                } catch (error) {
                    console.error('Token verification failed:', error);
                    logout();
                }
            } else {
                console.log('No token found');
                setUser(null);
                setCredit(0);
            }
        };

        verifyToken();
    }, [token]);

    const value = {
        token, setToken,
        user, setUser,
        showLogin, setShowLogin,
        credit, setCredit,
        loadCreditsData,
        backendUrl,
        generateImage,
        logout,
        loading,
        error,
        generatedImage
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider