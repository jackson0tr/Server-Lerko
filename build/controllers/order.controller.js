"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newPayment = exports.sendStripePublishableKey = exports.getAllOrders = exports.createOrder = void 0;
require('dotenv').config();
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const user_model_1 = __importDefault(require("../model/user.model"));
const course_model_1 = __importDefault(require("../model/course.model"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notification_model_1 = __importDefault(require("../model/notification.model"));
const order_service_1 = require("../services/order.service");
const redis_1 = require("../utils/redis");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// ============================================ CREATE ORDER ==========================================================
exports.createOrder = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { courseId, paymentInfo } = req.body;
        if (paymentInfo) {
            if ("id" in paymentInfo) {
                const paymentIntentId = paymentInfo.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status !== "succeeded") {
                    return next(new ErrorHandler_1.default("Payment not authorized!", 400));
                }
            }
        }
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        const courseExistInUser = user?.courses.some((course) => course._id.toString() === courseId);
        if (courseExistInUser) {
            return next(new ErrorHandler_1.default('You have already purchased this course', 400));
        }
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default('Course not found', 404));
        }
        const data = {
            courseId: course._id,
            userId: user?._id,
            paymentInfo
        };
        const mailData = {
            order: {
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            }
        };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, '../mails/conformOrder.ejs'), { order: mailData });
        try {
            if (user) {
                await (0, sendMail_1.default)({
                    email: user.email,
                    subject: "تأكيد الطلب",
                    template: "conformOrder.ejs",
                    data: mailData
                });
            }
        }
        catch (err) {
            return next(new ErrorHandler_1.default(err.message, 500));
        }
        user?.courses.push(course?._id);
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        await user?.save();
        await notification_model_1.default.create({
            user: user?._id,
            title: "طلب جديد",
            message: `لديك طلب جديد من ${course?.name}`
        });
        // course.purchased ? course.purchased += 1 : course.purchased;
        // create courses purchased counts
        course.purchased = course.purchased + 1;
        await course.save();
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ GET ALL ORDERS ==========================================================
exports.getAllOrders = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        (0, order_service_1.getAllOrdersService)(res);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ SEND STRIPE PUBLISHABLE KEY ==========================================================
exports.sendStripePublishableKey = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        res.status(200).json({
            publishablekey: process.env.STRIPE_PUBLISHABLE_KEY
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ NEW PAYMENT ==========================================================
exports.newPayment = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const myPayment = await stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: "USD",
            metadata: {
                company: "Lerko",
            },
            automatic_payment_methods: {
                enabled: true,
            }
        });
        res.status(201).json({
            success: true,
            client_secret: myPayment.client_secret
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
