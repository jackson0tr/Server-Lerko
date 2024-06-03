"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.updateNotifications = exports.getNotifications = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const notification_model_1 = __importDefault(require("../model/notification.model"));
const node_cron_1 = __importDefault(require("node-cron"));
const user_service_1 = require("../services/user.service");
// ============================================ GET ALL NOTIFICATIONS {ADMIN} ==========================================================
exports.getNotifications = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const notifications = await notification_model_1.default.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            notifications
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ UPDATE NOTIFICATIONS STATUS {ADMIN} ==========================================================
exports.updateNotifications = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const notification = await notification_model_1.default.findById(req.params.id);
        if (!notification) {
            return next(new ErrorHandler_1.default('Notification not found', 404));
        }
        else {
            notification.status ? notification.status = 'read' : notification.status;
        }
        await notification.save();
        const notifications = await notification_model_1.default.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            notifications
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ DELETE NOTIFICATIONS STATUS {ADMIN} ==========================================================
node_cron_1.default.schedule("0 0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await notification_model_1.default.deleteMany({ status: "read", createdAt: { $lt: thirtyDaysAgo } });
});
// ============================================ GET ALL USERS ==========================================================
exports.getAllUsers = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        (0, user_service_1.getAllUsersService)(res);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
