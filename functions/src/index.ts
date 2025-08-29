import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
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
// FCM Functions
export const saveFCMToken = fcmFunctions.saveFCMToken;
export const sendNotification = fcmFunctions.sendNotification;
export const sendToTopic = fcmFunctions.sendToTopic;
export const subscribeToTopic = fcmFunctions.subscribeToTopic;

// Order Functions
export const onOrderCreated = orderFunctions.onOrderCreated;
export const onOrderStatusChanged = orderFunctions.onOrderStatusChanged;
export const updateOrderStatus = orderFunctions.updateOrderStatus;
export const assignDriver = orderFunctions.assignDriver;
export const getOrderAnalytics = orderFunctions.getOrderAnalytics;

// Driver Functions
export const updateDriverLocation = driverFunctions.updateDriverLocation;
export const getDriverLocation = driverFunctions.getDriverLocation;
export const getAvailableDrivers = driverFunctions.getAvailableDrivers;
export const toggleDriverStatus = driverFunctions.toggleDriverStatus;

// Analytics Functions
export const getAnalytics = analyticsFunction;

// Notification Functions
export const sendSMS = notificationFunctions.sendSMS;
export const sendEmail = notificationFunctions.sendEmail;

// Coupon Functions
export const validateCoupon = couponFunctions.validateCoupon;
export const createPromotionalCampaign = couponFunctions.createPromotionalCampaign;

// Loyalty Functions
export const calculateLoyaltyPoints = loyaltyFunctions.calculateLoyaltyPoints;
export const processLoyaltyReward = loyaltyFunctions.processLoyaltyReward;

// Cron Functions
export const cleanupExpiredCoupons = cronFunctions.cleanupExpiredCoupons;
export const processLoyaltyBonuses = cronFunctions.processLoyaltyBonuses;
export const sendDailyReports = cronFunctions.sendDailyReports;