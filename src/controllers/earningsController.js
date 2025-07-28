const earningsService = require('../services/earningsService');

/**
 * Gets earnings data for a specific cook.
 * Responds with JSON containing total earnings, order count, and chart data.
 */
async function getEarnings(req, res) {
    try {
        // The `verifyToken` middleware should have attached the user to the request.
        // We get the authenticated user's ID from `req.user`.
        const authenticatedUserId = req.user.id;
        const { cookId } = req.params;

        // Security Check: Ensure the authenticated user is requesting their own earnings.
        if (authenticatedUserId !== cookId) {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to view this data.' });
        }

        const { period } = req.query; // e.g., 'weekly', 'monthly', 'yearly'

        const earningsData = await earningsService.calculateEarnings(cookId, period);

        res.status(200).json(earningsData);
    } catch (error) {
        console.error('Error fetching earnings:', error);
        res.status(500).json({ message: 'Failed to fetch earnings data.' });
    }
}

module.exports = {
    getEarnings,
};