"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = void 0;
const socket_io_1 = require("socket.io");
const initSocketServer = (server) => {
    const io = new socket_io_1.Server(server);
    io.on("connection", (socket) => {
        console.log("User Connected");
        // Listen notification event from the frontend
        socket.on("notification", (data) => {
            // broadcast the notification data to all connected clients '{-admin-}'
            io.emit("newNotification", data);
        });
        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
    });
};
exports.initSocketServer = initSocketServer;
