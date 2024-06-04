import express from 'express';
import contacts from "../routes/contact"
import errorHandlerMiddleware from '../middleware/error-handler';
require("dotenv").config();

const app = express();
const serverPort = process.env.serverPORT || 5000;
const url = process.env.DB_URL || "";

app.use(express.json());
app.use("/",contacts);
app.use(errorHandlerMiddleware);

const start = async () => {
    try {
        app.listen(serverPort, () => console.log(`app listening on port ${serverPort}!`));

    } catch (error) {
        console.log(error);
    }
};

start();
