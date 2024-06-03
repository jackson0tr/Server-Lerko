"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_1 = require("../middleware/auth");
const analyticsRouter = express_1.default.Router();
analyticsRouter.get("/get-users", auth_1.isAutheticated, (0, auth_1.authorizeRole)("admin"), analytics_controller_1.getUserAnalytices);
analyticsRouter.get("/get-courses", auth_1.isAutheticated, (0, auth_1.authorizeRole)("admin"), analytics_controller_1.getCoursesAnalytices);
analyticsRouter.get("/get-orders", auth_1.isAutheticated, (0, auth_1.authorizeRole)("admin"), analytics_controller_1.getOrderAnalytices);
exports.default = analyticsRouter;
