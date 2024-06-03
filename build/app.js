"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require('dotenv').config();
const express_1 = __importDefault(require("express"));
exports.app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_1 = require("./middleware/error");
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const courseRoute_1 = __importDefault(require("./routes/courseRoute"));
const orderRoute_1 = __importDefault(require("./routes/orderRoute"));
const notificationRoute_1 = __importDefault(require("./routes/notificationRoute"));
const analyticsRoute_1 = __importDefault(require("./routes/analyticsRoute"));
const layoutRoute_1 = __importDefault(require("./routes/layoutRoute"));
const express_rate_limit_1 = require("express-rate-limit");
exports.app.use(express_1.default.json({ limit: "50mb" }));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use((0, cors_1.default)({
    origin: ['https://lerko.vercel.app'],
    credentials: true
}));
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false
});
exports.app.use('/api', userRoute_1.default, courseRoute_1.default, orderRoute_1.default, notificationRoute_1.default, analyticsRoute_1.default, layoutRoute_1.default); // public route
// test api
exports.app.get("/test", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "API has been working",
    });
});
exports.app.all("*", (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
exports.app.use(limiter);
exports.app.use(error_1.ErrorMiddleware);
