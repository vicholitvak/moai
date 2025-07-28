const express = require('express');
const router = express.Router();

// In a real application, you would use these for security:
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const User = require('../models/User'); // Assuming a User model

router.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Email, password, and role are required.' });
    }

    // In a real app, you would hash the password and save the new user to the database.
    console.log(`Signup attempt for: ${email} with role: ${role}`);

    // For now, we'll return a MOCK successful response, as if the user was created and logged in.
    const mockUser = { id: `user_${Date.now()}`, email, role };
    const token = 'mock-jwt-token-for-development-purposes';

    res.status(201).json({ token, user: mockUser });
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        // --- REAL DATABASE LOGIC WOULD GO HERE ---
        // 1. Find user in DB: const user = await User.findOne({ email });
        // 2. Compare password: const isMatch = await bcrypt.compare(password, user.password);
        // 3. If they match, generate a real JWT token.

        // For now, we'll return a MOCK successful response that always logs you in as a 'cooker'.
        console.log(`Login attempt for: ${email}`);
        const mockUser = { id: 'user123', email: email, role: 'cooker' };
        const token = 'mock-jwt-token-for-development-purposes';

        res.json({ token, user: mockUser });

    } catch (error) {
        console.error('Server login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;