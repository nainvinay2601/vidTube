import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  //Grab Token -> almost similar process as we did in the refreshToken

  // const token = req.cookies.accessToken || req.body.accessToken;
  // another way to get token is from header the bearer token that get's attached to the header
  const token =
    req.cookies.accessToken ||
    req.header("Authorization")?.replace("Bearer ", ""); // we grab the access token like this

  //Check token is present or not
  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  // We have the token so decode it

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "No User Found");
    }
    // likewise we take info using the req.body we can also add the info like this by making a new parameters 
    req.user = user;
    //Now we have additional information in the request and we can move forward , so next() -> next( ) will be logout controller
    //because of this middleware we have the access to the user and user's info 
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
