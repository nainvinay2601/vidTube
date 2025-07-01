import express, { urlencoded } from "express";
import { errorHandler } from "./middlewares/error.middlewares.js";

import cookieParser from "cookie-parser";
import logger from "./logger.js";
import morgan from "morgan";

import cors from "cors";
const morganFormat = ":method :url :status :response-time ms";

const app = express();

//COMMON MIDDLEWARES
app.use(express.json({ limit: "16kb" })); // body parsing

app.use(express.urlencoded({ extended: true, limit: "16kb" })); // space in the url wont be a space but %20 etc etc

app.use(express.static("public")); // for images videos
//Logger
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

//CORS Middleware

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//Cookie parser for session

app.use(cookieParser());

// app.get("/heathcheck") -> we can use this beginner method to return health status and all

// for professional approach -> we write first thing in healthCheck controller -> basically a healthcheck file in the controllers

// ===================== IMPORTED ROUTES =======================
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";

//routes

app.use("/api/v1/healthcheck", healthcheckRouter); // when someone hits up this route , the healthCheckROuter will take control of it and we dont have to serve something specific on our own
app.use("/api/v1/users", userRouter); // someones goes on this route -> userRouter will take control and based on the request of the user the user controller will take the action

// for example user is going for registeration
// /api/v1/users/register -> this route will hit the registerUser function in the user.controller which will be handling the logic of the user registeration basicallt

app.use(errorHandler);

export { app };
