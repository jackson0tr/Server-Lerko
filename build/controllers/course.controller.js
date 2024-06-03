"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseSearch = exports.generateVideoUrl = exports.deleteCourse = exports.getAllCourses = exports.addReplyCourse = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCoursePaid = exports.getAllCoursesFree = exports.getCourse = exports.editCourse = exports.uploadCourse = void 0;
require('dotenv').config();
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../model/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notification_model_1 = __importDefault(require("../model/notification.model"));
const axios_1 = __importDefault(require("axios"));
// ============================================ UPLOAD COURSE ==========================================================
exports.uploadCourse = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            };
        }
        (0, course_service_1.createCourse)(data, res, next);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ EDIT COURSE ==========================================================
exports.editCourse = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const courseId = req.params.id;
        const courseData = await course_model_1.default.findById(courseId);
        if (thumbnail
        // && !thumbnail.startsWith('https')
        ) {
            await cloudinary_1.default.v2.uploader.destroy(thumbnail.public_id);
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            };
        }
        // if(thumbnail.startsWith('https')){
        //     data.thumbnail = {
        //         public_id: courseData?.thumbnail.public_id,
        //         url: courseData?.thumbnail.secure_url
        //     }
        // }
        // if(thumbnail){
        //    data.thumbnail = {
        //         public_id: courseData?.thumbnail.public_id,
        //         url: courseData?.thumbnail.secure_url
        //     }
        // }
        const course = await course_model_1.default.findByIdAndUpdate(courseId, { $set: data }, { new: true });
        res.status(201).json({
            success: true,
            course
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ GET COURSE {Without Purchasing} ==========================================================
exports.getCourse = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const isCacheExist = await redis_1.redis.get(courseId);
        if (isCacheExist) {
            const course = JSON.parse(isCacheExist);
            res.status(200).json({
                success: true,
                course
            });
        }
        else {
            // Important it's ignore {videoUrl-suggestion-questions-links} from click to get the course
            // won't send this data bcs, it's an important data
            const course = await course_model_1.default.findById(courseId)
                .select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            await redis_1.redis.set(courseId, JSON.stringify(course), 'EX', 604800); // expired in 7 days 
            res.status(201).json({
                success: true,
                course
            });
        }
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ GET ALL COURSES {Without Purchasing} ==========================================================
exports.getAllCoursesFree = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        // const isCacheExist = await redis.get("allCourse");
        // if(isCacheExist){
        //     const courses = JSON.parse(isCacheExist);
        //     res.status(200).json({
        //         success:true,
        //         courses
        //     });
        // }else{
        // Important it's ignore {videoUrl-suggestion-questions-links} from click to get the course
        // won't send this data bcs, it's an important data
        const courses = await course_model_1.default.find()
            .select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        // await redis.set("allCourse",JSON.stringify(courses));
        res.status(201).json({
            success: true,
            courses
        });
        // }
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ GET COURSE {With Purchasing} ==========================================================
exports.getCoursePaid = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const userCourse = req.user?.courses;
        const courseId = req.params.id;
        const courseExists = userCourse?.find((course) => course._id.toString() === courseId);
        if (!courseExists) {
            return next(new ErrorHandler_1.default('You are not eligible to access this course', 404));
        }
        const course = await course_model_1.default.findById(courseId);
        const content = course?.courseData;
        res.status(201).json({
            success: true,
            content
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.addQuestion = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { question, courseId, contentId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default('Invalid content id', 400));
        }
        const courseContent = course?.courseData?.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default('Invalid content id', 400));
        }
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: []
        };
        courseContent.questions.push(newQuestion);
        await notification_model_1.default.create({
            user: req.user?._id,
            title: "تم استلام سؤال جديد",
            message: `لديك سؤال جديد في ${courseContent.title}`
        });
        await course?.save();
        res.status(200).json({
            success: true,
            course
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.addAnswer = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { answer, courseId, contentId, questionId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default('Invalid content id', 400));
        }
        const courseContent = course?.courseData?.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default('Invalid content id', 400));
        }
        const question = courseContent?.questions?.find((item) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler_1.default('Invalid question id', 400));
        }
        const newAnswer = {
            user: req.user,
            answer,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        question.questionReplies?.push(newAnswer);
        await course?.save();
        if (req.user?.id === question.user._id) {
            await notification_model_1.default.create({
                user: req.user?._id,
                title: "تم تلقي الرد على سؤال جديد",
                message: `لديك سؤال جديد الرد في ${courseContent.title}`
            });
        }
        else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
            const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, '../mails/questionReply.ejs'), data);
            try {
                await (0, sendMail_1.default)({
                    email: question.user.email,
                    subject: "الرد على السؤال",
                    template: "questionReply.ejs",
                    data
                });
            }
            catch (err) {
                return next(new ErrorHandler_1.default(err.message, 500));
            }
        }
        res.status(200).json({
            success: true,
            course
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.addReview = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const userCourse = req.user?.courses;
        const courseId = req.params.id;
        const courseExists = userCourse?.some((course) => course._id.toString() === courseId.toString());
        if (!courseExists) {
            return next(new ErrorHandler_1.default('You are not eligible to access this course', 404));
        }
        const { review, rating } = req.body;
        const course = await course_model_1.default.findById(courseId);
        const reviewData = {
            user: req.user,
            comment: review,
            rating
        };
        course?.reviews.push(reviewData);
        let avg = 0;
        course?.reviews.forEach((rev) => { avg += rev.rating; });
        if (course) {
            course.ratings = avg / course.reviews.length;
        }
        await course?.save();
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800); // Expire in 7 days  
        // const notification = {
        //     title: "New Review Received",
        //     message: `${req.user?.name} has been given a review in ${course?.name}`
        // }
        await notification_model_1.default.create({
            user: req.user?._id,
            title: "تم استلام مراجعة جديدة",
            message: `${req.user?.name} وقد أعطيت مراجعة في ${course?.name}`
        });
        res.status(200).json({
            success: true,
            course
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.addReplyCourse = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default('Course not found', 404));
        }
        const review = course?.reviews?.find((rev) => rev._id.toString() === reviewId);
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found", 404));
        }
        const replyData = {
            user: req.user,
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        if (!review.commentReplies) {
            review.commentReplies = [];
        }
        review.commentReplies?.push(replyData);
        await course?.save();
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800); // Expire in 7 days  
        res.status(200).json({
            success: true,
            course
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ GET ALL COURSES ==========================================================
exports.getAllCourses = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        (0, course_service_1.getAllCoursesService)(res);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// ============================================ DELETE Course ==========================================================
exports.deleteCourse = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await course_model_1.default.findById(id);
        if (!course) {
            return next(new ErrorHandler_1.default('Course not found', 404));
        }
        await course.deleteOne({ id });
        await redis_1.redis.del(id);
        res.status(201).json({
            success: true,
            message: "Course deleted successfully"
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// ============================================ GENERATE VIDEO URL  ==========================================================
exports.generateVideoUrl = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { videoUrl } = req.body;
        if (!videoUrl) {
            console.error('can not find video id');
        }
        const response = await axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoUrl}/otp`, { ttl: 300 }, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Apisecret ${process.env.VODCIPHER_API_SECRET}`
            }
        });
        res.json(response.data);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// ============================================ GENERATE VIDEO URL  ==========================================================
exports.courseSearch = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const data = await course_model_1.default.find({ "$or": [
                { title: { $regex: req.params.key } },
                // {categories: {$regex: req.params.key}}
            ] });
        res.json(data);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
