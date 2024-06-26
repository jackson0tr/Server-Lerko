"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const notification_controller_1 = require("../controllers/notification.controller");
const userRouter = express_1.default.Router();
userRouter.post('/register', user_controller_1.register);
userRouter.post('/activeUser', user_controller_1.activateUser);
userRouter.post('/login', user_controller_1.login);
userRouter.get('/logout', auth_1.isAutheticated, user_controller_1.logout);
userRouter.get('/refresh', user_controller_1.updateAccessToken);
userRouter.get('/userInfo', user_controller_1.updateAccessToken, auth_1.isAutheticated, user_controller_1.getUserInfo);
userRouter.post('/socialAuth', user_controller_1.socialAuth);
userRouter.put('/update', user_controller_1.updateAccessToken, auth_1.isAutheticated, user_controller_1.updateUserInfo);
userRouter.put('/updatePassword', user_controller_1.updateAccessToken, auth_1.isAutheticated, user_controller_1.updatePassword);
userRouter.put('/pic', user_controller_1.updateAccessToken, auth_1.isAutheticated, user_controller_1.updateUserPic);
userRouter.get('/all', user_controller_1.updateAccessToken, auth_1.isAutheticated, (0, auth_1.authorizeRole)("admin"), notification_controller_1.getAllUsers);
userRouter.put('/update-role', user_controller_1.updateAccessToken, auth_1.isAutheticated, (0, auth_1.authorizeRole)("admin"), user_controller_1.updateUserRole);
userRouter.delete('/delete-user/:id', user_controller_1.updateAccessToken, auth_1.isAutheticated, (0, auth_1.authorizeRole)("admin"), user_controller_1.deleteUser);
userRouter.post('/forget-password', user_controller_1.forgetPassword);
userRouter.post('/reset-password/:id/:token', user_controller_1.resetPassword);
exports.default = userRouter;
