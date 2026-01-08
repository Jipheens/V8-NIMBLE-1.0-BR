class AuthService {
    /**
     * Attempt to log in with the provided credentials.
     * @param {string} operatorId 
     * @param {string} password 
     * @param {string} branchId 
     * @returns {Promise<{success: boolean, message?: string, data?: any}>}
     */
    static async login(operatorId, password, branchId) {
        const url = `${AUTH_CONFIG.API_BASE_URL}${AUTH_CONFIG.ENDPOINTS.LOGIN}`;
        const payload = {
            operatorID: operatorId,
            password: password,
            branchID: branchId
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // The API might return 200 with an error code inside, or 4xx/5xx
            // But let's check HTTP status first
            if (!response.ok) {
                // Try to read error message if possible
                const errorText = await response.text();
                throw new Error(`Server Error (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            // Expected logic: statusCode 200 means success
            if (data.statusCode === 200 && data.entity) {
                this.setSession(data.entity);
                return { success: true, data: data.entity };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'Network connection failed' };
        }
    }

    /**
     * Save session data to local storage
     * @param {object} sessionData 
     */
    static setSession(sessionData) {
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(sessionData));
    }

    /**
     * Retrieve session data from local storage
     * @returns {object|null}
     */
    static getSession() {
        try {
            const sessionStr = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
            return sessionStr ? JSON.parse(sessionStr) : null;
        } catch (e) {
            console.warn("Corrupt session data", e);
            return null;
        }
    }

    /**
     * Clear user session
     */
    static logout() {
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY);
        window.location.replace("login.html");
    }

    /**
     * Check if user is legally authenticated
     * @returns {boolean}
     */
    static isAuthenticated() {
        const session = this.getSession();
        // In production, we should check expiry (exp claim in token)
        return !!session && !!session.token;
    }

    /**
     * Generic fetch wrapper that adds Authorization header
     * @param {string} endpoint 
     * @param {object} options 
     */
    static async authFetch(endpoint, options = {}) {
        const session = this.getSession();
        if (!session || !session.token) {
            // Redirect to login if no token? Or let the caller handle it?
            // For now, let's just proceed or throw.
            throw new Error("No active session");
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
            ...(options.headers || {})
        };

        const url = endpoint.startsWith('http') ? endpoint : `${AUTH_CONFIG.API_BASE_URL}${endpoint}`;

        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            // Token expired
            this.logout();
        }
        return response;
    }
}
