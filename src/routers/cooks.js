const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earningsController');
const authMiddleware = require('../middleware/auth'); // Assuming you have auth middleware

// GET /api/cooks/:cookId/earnings
// This route should be protected to ensure a cook can only see their own earnings.
router.get('/:cookId/earnings', authMiddleware.verifyToken, earningsController.getEarnings);

module.exports = router;

// Don't forget to use this router in your main app file (e.g., app.js or server.js)
// app.use('/api/cooks', cooksRouter);