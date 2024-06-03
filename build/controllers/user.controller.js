"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgetPassword = exports.deleteUser = exports.updateUserRole = exports.updateUserPic = exports.updatePassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.updateAccessToken = exports.logout = exports.login = exports.activateUser = exports.createActivationToken = exports.register = void 0;
require('dotenv').config();
const user_model_1 = __importDefault(require("../model/user.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const user_service_1 = require("../services/user.service");
const cloudinary_1 = __importDefault(require("cloudinary"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
exports.register = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const isEmailExist = await user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler_1.default("Email already exist", 400));
        }
        ;
        const user = {
            name,
            email,
            password,
        };
        const activationToken = (0, exports.createActivationToken)(user);
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/activationMail.ejs"), data);
        try {
            await (0, sendMail_1.default)({
                email: user.email,
                subject: "فعل حسابك",
                template: "activationMail.ejs",
                data
            });
            res.status(201).json({
                success: true,
                message: `تفقد بريدك الالكتروني من فضلك: ${user.email} لتفعيل حسابك!`,
                activationToken: activationToken.token
            });
        }
        catch (err) {
            return next(new ErrorHandler_1.default(err.message, 400));
        }
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jsonwebtoken_1.default.sign({
        user, activationCode
    }, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m",
    });
    return { token, activationCode };
};
exports.createActivationToken = createActivationToken;
exports.activateUser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { activation_token, activation_code } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activation_token, process.env.ACTIVATION_SECRET);
        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler_1.default('Invalid activation code ', 400));
        }
        const { name, email, password } = newUser.user;
        const existUser = await user_model_1.default.findOne({ email });
        if (existUser) {
            return next(new ErrorHandler_1.default('Email already exist', 400));
        }
        const user = await user_model_1.default.create({
            name,
            email,
            password
        });
        res.status(201).json({
            success: true,
            user
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.login = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler_1.default('Please enter email and password', 400));
        }
        ;
        const user = await user_model_1.default.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler_1.default('Invalid email or password', 400));
        }
        ;
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default('Invalid password', 400));
        }
        ;
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// ============================================ LOGOUT ==========================================================
exports.logout = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        const userId = req.user?._id || '';
        console.log('userId:', userId);
        redis_1.redis.del(userId);
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// ============================================ UPDATE ACCESS TOKEN ==========================================================
exports.updateAccessToken = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const refresh_token = req.cookies.refresh_token;
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN);
        if (!decoded) {
            return next(new ErrorHandler_1.default('Could not refresh token', 400));
        }
        const session = await redis_1.redis.get(decoded.id);
        if (!session) {
            return next(new ErrorHandler_1.default('Please login to access this resource', 400));
        }
        const user = JSON.parse(session);
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
            expiresIn: '30m'
        });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.REFRESH_TOKEN, {
            expiresIn: '3d'
        });
        req.user = user;
        res.cookie('access_token', accessToken, jwt_1.accessTokenOptions);
        res.cookie('refresh_token', refreshToken, jwt_1.refreshTokenOptions);
        await redis_1.redis.set(user._id, JSON.stringify(user), "EX", 604800); // expired in 7 days 
        // res.status(200).json({
        //     success: true,
        //     accessToken
        // });
        next();
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// ============================================ USER INFO ==========================================================
exports.getUserInfo = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const userId = req.user?._id;
        (0, user_service_1.getUserById)(userId, res);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.socialAuth = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { email, name, avatar } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            const newUser = await user_model_1.default.create({ email, name, avatar });
            (0, jwt_1.sendToken)(newUser, 200, res);
        }
        else {
            (0, jwt_1.sendToken)(user, 200, res);
        }
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.updateUserInfo = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { name } = req.body;
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        if (name && user) {
            user.name = name;
        }
        await user?.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(201).json({
            success: true,
            user
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.updatePassword = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler_1.default('Please enter old and new password', 400));
        }
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId).select('+password');
        if (user?.password === undefined) {
            return next(new ErrorHandler_1.default('Invalid user', 400));
        }
        const isPasswordMatch = await user?.comparePassword(oldPassword);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default('Invalid old password', 400));
        }
        user.password = newPassword;
        await user.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(201).json({
            success: true,
            user
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
exports.updateUserPic = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { avatar } = req.body;
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        if (avatar && user) {
            if (user?.avatar?.public_id) {
                // delete old pic
                await cloudinary_1.default.v2.uploader.destroy(user?.avatar?.public_id);
            }
            else {
                const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "Pics",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                };
            }
        }
        await user?.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(201).json({
            success: true,
            message: 'Profile pic has been uploaded successfully',
            user
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// ============================================ UPDATE USER ROLE ==========================================================
exports.updateUserRole = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { id, role } = req.body;
        (0, user_service_1.updateUserRoleService)(res, id, role);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// ============================================ DELETE USER ==========================================================
exports.deleteUser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await user_model_1.default.findById(id);
        if (!user) {
            return next(new ErrorHandler_1.default('User not found', 404));
        }
        await user.deleteOne({ id });
        await redis_1.redis.del(id);
        res.status(201).json({
            success: true,
            message: "User deleted successfully"
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// ============================================ FORGET PASSWORD ==========================================================
exports.forgetPassword = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            return next(new ErrorHandler_1.default('User not found', 404));
        }
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            service: process.env.SMTP_SERVICE,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD
            },
        });
        const locale = 'ar';
        // const token = jwt.sign({id: user._id}, "jwt_secret_key", {expiresIn: '2h'});
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
            expiresIn: '1d'
        });
        // sendToken(user,200,res);
        const resetToken = `${process.env.FRONT_LINK}/${locale}/reset-password/${user._id}/${token}`;
        const data = { user: { name: user.name }, resetToken };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/resetPassword.ejs"), data);
        try {
            await (0, sendMail_1.default)({
                email: user.email,
                subject: "اعد ضبط كلمه السر",
                template: "resetPassword.ejs",
                data
            });
            res.status(201).json({
                success: true,
                message: `انقر هنا لإعادة تعيين كلمة المرور الخاصة بك: ${process.env.FRONT_LINK}/${locale}/reset-password/${user._id}/${token}`,
            });
        }
        catch (err) {
            return next(new ErrorHandler_1.default(err.message, 400));
        }
        // const mailOptions = {
        //     from: process.env.STMP_MAIL,
        //     to: email,
        //     subject: "اعد ضبط كلمه السر",
        //     text: `انقر هنا لإعادة تعيين كلمة المرور الخاصة بك:  ${process.env.FRONT_LINK}/${locale}/reset-password/${user._id}/${token}`
        // }
        // await transporter.sendMail(mailOptions, function(error,info){
        //     if(error){
        //         console.log(error)
        //     }else{
        //         return res.status(201).json({
        //             success: true,
        //             message: "Code send successfully!"
        //         });
        //     }
        // });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
// ============================================ RESET PASSWORD ==========================================================
exports.resetPassword = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    try {
        const { password } = req.body;
        const { id, token } = req.params;
        jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
            if (err) {
                return next(new ErrorHandler_1.default(err.message, 404));
            }
            else {
                bcryptjs_1.default.hash(password, 10)
                    .then(hash => {
                    user_model_1.default.findByIdAndUpdate({ _id: id }, { password: hash })
                        .then(u => res.status(201).json({
                        success: true,
                        message: "Password Reset Successfully!"
                    }));
                });
            }
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 400));
    }
});
