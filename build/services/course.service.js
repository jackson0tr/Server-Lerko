"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCoursesService = exports.createCourse = void 0;
const course_model_1 = __importDefault(require("../model/course.model"));
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
// ============================================ CREATE COURSE ==========================================================
exports.createCourse = (0, catchAsyncErrors_1.default)(async (data, res) => {
    const course = await course_model_1.default.create(data);
    res.status(201).json({
        success: true,
        course
    });
});
// ============================================ GET ALL USERS ==========================================================
const getAllCoursesService = async (res) => {
    const courses = await course_model_1.default.find().sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        courses
    });
};
exports.getAllCoursesService = getAllCoursesService;
