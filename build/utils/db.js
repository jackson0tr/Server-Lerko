"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
require('dotenv').config();
const dbUrl = process.env.DB_URL || '';
const connectedDb = async () => {
    try {
        await mongoose_1.default.connect(dbUrl).then((data) => {
            console.log(`Database is connected... ${data.connection.host}`);
        });
    }
    catch (err) {
        console.log(err.message);
        setTimeout(connectedDb, 5000);
    }
};
exports.default = connectedDb;
