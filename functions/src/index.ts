import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as express from 'express';

// Initialize Firebase Admin
admin.initializeApp();

const corsHandler = cors({ origin: true });

// Import all function modules
import { fcmFunctions } from './fcm';
import { orderFunctions } from './orders';
import { driverFunctions } from './drivers';
import { analyticsFunction } from './analytics';
import { notificationFunctions } from './notifications';
import { couponFunctions } from './coupons';
import { loyaltyFunctions } from './loyalty';
import { cronFunctions } from './cron';

// Export all functions
export {
  // FCM Functions
  saveFCMToken: fcmFunctions.saveFCMToken,
  sendNotification: fcmFunctions.sendNotification,
  sendToTopic: fcmFunctions.sendToTopic,
  subscribeToTopic: fcmFunctions.subscribeToTopic,

  // Order Functions  
  onOrderCreated: orderFunctions.onOrderCreated,
  onOrderStatusChanged: orderFunctions.onOrderStatusChanged,
  updateOrderStatus: orderFunctions.updateOrderStatus,
  assignDriver: orderFunctions.assignDriver,
  getOrderAnalytics: orderFunctions.getOrderAnalytics,

  // Driver Functions
  updateDriverLocation: driverFunctions.updateDriverLocation,
  getDriverLocation: driverFunctions.getDriverLocation,
  getAvailableDrivers: driverFunctions.getAvailableDrivers,
  toggleDriverStatus: driverFunctions.toggleDriverStatus,

  // Analytics Functions
  getAnalytics: analyticsFunction,

  // Notification Functions
  sendSMS: notificationFunctions.sendSMS,
  sendEmail: notificationFunctions.sendEmail,

  // Coupon Functions
  validateCoupon: couponFunctions.validateCoupon,
  createPromotionalCampaign: couponFunctions.createPromotionalCampaign,

  // Loyalty Functions
  calculateLoyaltyPoints: loyaltyFunctions.calculateLoyaltyPoints,
  processLoyaltyReward: loyaltyFunctions.processLoyaltyReward,

  // Cron Functions
  cleanupExpiredCoupons: cronFunctions.cleanupExpiredCoupons,
  processLoyaltyBonuses: cronFunctions.processLoyaltyBonuses,
  sendDailyReports: cronFunctions.sendDailyReports
};