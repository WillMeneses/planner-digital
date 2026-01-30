import { APP_CONFIG } from '../../config';
import { AuthService } from '../auth';

// Centralized API Client
const apiClient = {
    request: async (endpoint, options = {}) => {
        // Ensure cloud mode is active (or we could make this client smart enough to switch? 
        // For now, repositories decide, but this client handles the HTTP part)

        const url = `${APP_CONFIG.API_URL}${endpoint}`;

        const user = AuthService.getCurrentUser();
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        // Auto-inject Auth Header if user exists
        if (user) {
            headers['X-User-Id'] = user.id;
        }

        const config = {
            ...options,
            headers,
        };

        try {
            console.log(`API Request: ${options.method || 'GET'} ${url}`);
            const response = await fetch(url, config);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`API Error ${response.status}: ${text}`);
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error("API Request Failed:", error);
            throw error;
        }
    },

    get: (endpoint) => apiClient.request(endpoint, { method: 'GET' }),
    post: (endpoint, body) => apiClient.request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => apiClient.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => apiClient.request(endpoint, { method: 'DELETE' }),
};

export default apiClient;
