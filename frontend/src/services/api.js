import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8080/api');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to every request automatically
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Global 401 response handling
let isHandling401 = false;

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response ? error.response.status : null;
        const requestUrl = error.config ? error.config.url || '' : '';

        // Check if this is an authentication-related endpoint where 401 is expected
        // e.g. bad credentials on login/signup, password reset
        const isAuthEndpoint =
            requestUrl.includes('/auth/signin') ||
            requestUrl.includes('/auth/signup') ||
            requestUrl.includes('/admin/auth/') ||
            requestUrl.includes('/auth/forgot-password') ||
            requestUrl.includes('/auth/reset-password') ||
            requestUrl.includes('/auth/oauth2/exchange');

        if (status === 401 && !isAuthEndpoint) {
            const hadToken = Boolean(localStorage.getItem('token'));

            // Only trigger eviction and redirect if the request was an authenticated session that expired
            if (hadToken && !isHandling401) {
                isHandling401 = true;

                // Evict expired credentials
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Notify active tab AuthContext via storage event
                window.dispatchEvent(new Event('storage'));

                const currentPath = window.location.pathname;
                const isAuthPage =
                    currentPath === '/login' ||
                    currentPath === '/signup' ||
                    currentPath === '/admin/login' ||
                    currentPath === '/forgot-password' ||
                    currentPath === '/reset-password' ||
                    currentPath === '/oauth2/redirect';

                if (!isAuthPage) {
                    const isAdminPath = currentPath.startsWith('/admin');
                    const redirectTarget = isAdminPath ? '/admin/login' : '/login';

                    // Debounce redirect slightly to allow current component catch-blocks to settle cleanly
                    setTimeout(() => {
                        window.location.href = redirectTarget;
                        isHandling401 = false;
                    }, 100);
                } else {
                    isHandling401 = false;
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;