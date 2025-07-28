// A service to represent API calls for authentication.
// In a real app, this would use fetch or a library like axios.
const authService = {
    /**
     * Verifies the current session token with the backend.
     * @returns {Promise<object>} The user data.
     */
    verifySession: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("No token found");
        }

        // This should be your actual API endpoint for verifying a token.
        // It should be protected and return the user's profile information.
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Session is invalid or expired.');
        }

        return await response.json(); // e.g., { user: { id: '...', role: 'cook' } }
    }
};

export default authService;