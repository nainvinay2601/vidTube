import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { User } from "../models/user.models.js";

const registerUser = asyncHandler(async (req, res) => {
  // HOW WE WILL REGISTER THE USER???
  //1- take the data from the user  -> this can be done using the bodyParse tech
  const { fullName, email, username, password } = req.body;
  // the file part will be injected by the multer which wont be coming with the body tho

  //validation now
  //   if (fullName?.trim() === "") {
  //     throw new ApiError(400, "All fields are required :(");
  //   }

  // better variant to check fields

  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required :(");
  }

  //Check if user already exist or not
  // user comes from model -> model in database so async function

  // Run query on the User model using Or function like find on the basis of the email or the username doesnt matter which one
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User With Email or Username already exist :( please try logging in "
    );
  }

  //================== HANDLE FILES ======================

  // if we are at this part of the code means the user doesn't exist it's a new user and validation is all done

  // images comes in the files not body and given to us by the multer

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, " Avatar file missing :(  ");
  }

  // Now we want to directly upload it to the cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage = "";
  if (coverLocalPath) {
    coverImage = await uploadOnCloudinary(coverLocalPath);
  }

  //Construct A User Now
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //Verify user if the user is created or not
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" // syntax of deselecting
  );

  //conditionalCheck -> if we failed to create a user
  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong on server side, please wait :("
    );
  }

  //if user has been created return it to frontend
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered Successfully"));
});

export { registerUser };
