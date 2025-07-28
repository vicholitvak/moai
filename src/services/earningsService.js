// Assuming you have Sequelize models for Order and Cook
const { Order } = require('../models');
const { Op, fn, col } = require('sequelize');

/**
 * Calculates earnings data for a given cook over a specified period.
 * @param {string} cookId - The ID of the cook.
 * @param {string} [period='monthly'] - The time period ('weekly', 'monthly', 'yearly').
 * @returns {Promise<object>} An object with earnings data.
 */
async function calculateEarnings(cookId, period = 'monthly') {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'weekly':
            startDate = new Date(new Date().setDate(now.getDate() - 7));
            break;
        case 'yearly':
            startDate = new Date(new Date().setFullYear(now.getFullYear() - 1));
            break;
        case 'monthly':
        default:
            startDate = new Date(new Date().setMonth(now.getMonth() - 1));
            break;
    }

    const whereClause = {
        cookId: cookId,
        status: 'completed', // Only count completed orders
        createdAt: {
            [Op.gte]: startDate,
        },
    };

    // Calculate total earnings and order count for the period
    const stats = await Order.findOne({
        attributes: [
            [fn('SUM', col('totalPrice')), 'totalEarnings'],
            [fn('COUNT', col('id')), 'orderCount'],
        ],
        where: whereClause,
        raw: true,
    });

    // Get data points for an earnings chart
    const chartData = await Order.findAll({
        attributes: [[fn('DATE', col('createdAt')), 'date'], [fn('SUM', col('totalPrice')), 'dailyEarnings']],
        where: whereClause,
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        raw: true,
    });

    return {
        totalEarnings: parseFloat(stats.totalEarnings) || 0,
        orderCount: parseInt(stats.orderCount, 10) || 0,
        period,
        chartData,
    };
}

module.exports = {
    calculateEarnings,
};