import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // 1. Import the useAuth hook

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth(); // 2. Get the login function from the context

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        try {
            // 3. Call the actual login function
            await login(email, password);
            // The AuthProvider now handles the redirect on success
        } catch (err) {
            console.error('Failed to log in:', err);
            // 4. Display an error message to the user
            setError(err.message || 'An unexpected error occurred.');
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div>
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default LoginPage;