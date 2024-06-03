import { app } from "./app";
import { initSocketServer } from "./socketIndex";
import connectedDb from "./utils/db";
import {v2 as cloudinary} from "cloudinary";
require("dotenv").config();
import http from 'http';
const server = http.createServer(app);

// Config cloudinary 
cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_SCERET_KEY
});

initSocketServer(server);

const port = process.env.PORT;

app.listen(port, ()=> {
    console.log(`Server is connected with port ${port}`);
    connectedDb();
})

