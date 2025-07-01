//this will require couple of stuff
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  let error = err;
  // manipulate error and find the root cause (instance of error)

  if ((!error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose ? 400 : 500;

    const message = error.message || "Something went wrong ";

    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  //make error available as response as object by destruct 

  const response = {
    ...error, 
    message:error.message, 
    ...(process.env.NODE_ENV === "development" ? {
        stack:error.stack
    } : {

    })
  }

  return res.status(error.statusCode).json(response)

};
//will be used in the app.js as some are used in the routes some just used in the main server as we are handling all the type of errors
export { errorHandler };
