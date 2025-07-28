const express = require('express');
const router = express.Router();

// This is a placeholder for your actual authentication middleware.
// It should verify a JWT from the Authorization header and attach the user to the request.
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).send({ message: 'Authentication required.' });
    }
    // In a real app, you would decode the token to get the user's ID and role.
    req.user = { id: 'cookerId_from_token', role: 'cooker' };
    next();
};

// Route: POST /api/dishes
// Creates a new dish for the authenticated cook.
router.post('/', authMiddleware, async (req, res) => {
    // Ensure the user has the correct role
    if (req.user.role !== 'cooker') {
        return res.status(403).send({ message: 'Forbidden: Only cookers can add dishes.' });
    }

    const { name, description, price, prepTimeMinutes } = req.body;

    if (!name || !description || !price || !prepTimeMinutes) {
        return res.status(400).send({ message: 'All dish fields are required.' });
    }

    try {
        // In a real application, you would save this to your database (e.g., Firestore)
        // and associate it with the cook's ID from the token (req.user.id).
        const newDish = {
            id: `dish_${Date.now()}`, // Mock ID
            cookId: req.user.id,
            ...req.body
        };

        console.log('New dish created:', newDish);
        res.status(201).send(newDish);
    } catch (error) {
        res.status(500).send({ message: 'Error creating dish.' });
    }
});

module.exports = router;