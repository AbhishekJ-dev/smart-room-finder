/**
 * Centralized API configuration for the frontend.
 * Detects the environment and fallbacks to the production URL when not on localhost.
 */

const getApiUrl = () => {
    // If explicitly provided via environment variable, use it
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Default fallbacks based on execution environment
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    return isLocal 
        ? 'http://localhost:5000' 
        : 'https://smart-room-finder-backend.onrender.com';
};

export const API_BASE_URL = getApiUrl();
export const API_URL = `${API_BASE_URL}/api`;
