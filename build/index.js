"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const socketIndex_1 = require("./socketIndex");
const db_1 = __importDefault(require("./utils/db"));
const cloudinary_1 = require("cloudinary");
require("dotenv").config();
const http_1 = __importDefault(require("http"));
const server = http_1.default.createServer(app_1.app);
// Config cloudinary 
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SCERET_KEY
});
(0, socketIndex_1.initSocketServer)(server);
const port = process.env.PORT;
app_1.app.listen(port, () => {
    console.log(`Server is connected with port ${port}`);
    (0, db_1.default)();
});
