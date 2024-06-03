"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderAnalytices = exports.getCoursesAnalytices = exports.getUserAnalytices = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const analytics_generator_1 = require("../utils/analytics.generator");
const user_model_1 = __importDefault(require("../model/user.model"));
const course_model_1 = __importDefault(require("../model/course.model"));
const order_model_1 = __importDefault(require("../model/order.model"));
// ============================================ GET USERS ANALYTICS ==========================================================
exports.getUserAnalytices = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const users = await (0, analytics_generator_1.generateLastYearData)(user_model_1.default);
        res.status(201).json({
            success: true,
            users
        });
    }
    catch (err) {
        next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ GET COURSES ANALYTICS ==========================================================
exports.getCoursesAnalytices = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const courses = await (0, analytics_generator_1.generateLastYearData)(course_model_1.default);
        res.status(201).json({
            success: true,
            courses
        });
    }
    catch (err) {
        next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ GET ORSERS ANALYTICS ==========================================================
exports.getOrderAnalytices = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const orders = await (0, analytics_generator_1.generateLastYearData)(order_model_1.default);
        res.status(201).json({
            success: true,
            orders
        });
    }
    catch (err) {
        next(new ErrorHandler_1.default(err.message, 500));
    }
});
