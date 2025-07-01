import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";

//helper function (didnt save it in util folder as we just need this helper function here only)
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    // user existence check
    if (!user) {
      throw new ApiError(404, "Failed to find the user :(");
    }

    // user found  -> now take access of access and refresh token

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // as we are saving the refresh token in the user model too which is long term token

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something Went Wrong  While Generating Access And Refresh Token :( "
    );
  }
};

//Register a new user functionality

const registerUser = asyncHandler(async (req, res) => {
  // HOW WE WILL REGISTER THE USER???
  //1- take the data from the user  -> this can be done using the bodyParse tech
  const { fullname, email, username, password } = req.body;
  // the file part will be injected by the multer which wont be coming with the body tho

  //validation now
  //   if (fullName?.trim() === "") {
  //     throw new ApiError(400, "All fields are required :(");
  //   }

  // better variant to check fields

  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
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

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, " Avatar file missing :(  ");
  }

  // Now we want to directly upload it to the cloudinary
  // const avatar = await uploadOnCloudinary(avatarLocalPath);
  // let coverImage = "";
  // if (coverLocalPath) {
  //   coverImage = await uploadOnCloudinary(coverLocalPath);
  // }

  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.warn("Uploaded Avatar", avatar);
  } catch (error) {
    console.log("Error uploading avatar :(", error);
    throw new ApiError(500, "failed to upload avatar");
  }
  let coverImage;
  try {
    coverImage = await uploadOnCloudinary(coverLocalPath);
    console.warn("Uploaded Cover Image", coverImage);
  } catch (error) {
    console.log("Error uploading coverImage :(", error);
    throw new ApiError(500, "failed to upload coverImage");
  }

  //Construct A User Now
  try {
    const user = await User.create({
      fullname,
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
  } catch (error) {
    console.log("User Creation Failed");
    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }

    throw new ApiError(
      500,
      "Something went wrong on the server side while creating the user and images were deleted too :("
    );
  }
});

// Login User functionality

const loginUser = asyncHandler(async (req, res) => {
  // STEP-1 Get Data from the body
  const { email, username, password } = req.body;

  // STEP-2 Validation -> depends if we want to check all or just one as our unique is email so we check that here
  if (!email) {
    throw new ApiError(400, "Email Is Required");
  }
  //STEP-3 Find user based on email or id provided in the body
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  //STEP-4 Check if user exist or not
  if (!user) {
    throw new ApiError(402, "User Not Found");
  }

  // Step-5 Found the user and now we validate the user password  -- validating using the method we defined in the user model
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }

  //STEP-6 -> Password creds is validated and now we want to use the helper function to grab tokens

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id // _id as mongoDB saves the id of the entity like that
  ); // we can save the token right here and here but running a seperate query will help us to tackle any error

  // STEP-7 Take the user creds except the password and refresh token -> as we have to send these loggedIn Details to the user
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //STEP-8 Check again if there is a loggedIn User or not to keep the model error free

  if (!loggedInUser) {
    throw new ApiError(408, "No Logged In User Found :(");
  }

  //STEP-9 Set Options for the cookie

  const options = {
    httpOnly: true, // this will make the cookie non-modifyable by the client side only we can do that
    secure: process.env.NODE_ENV === "production", // secure it if the environment is production not the development as in the dev env we will be trying up some stuff too
  };

  //STEP-10 Return data

  return (
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      // .json(new ApiResponse(200, loggedInUser, "User Logged In Successfully :)")); - a better way to send response as in mobile app we cant set cookies
      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken, refreshToken },
          "user logged in successfully "
        )
      )
  );
});

//Logout Functionality
const logoutUser = asyncHandler(async (req, res) => {
  // MAIN part is to grab the user id and remove the refreshToken from it ----------

  // await User.findByIdAndUpdate(req.user._id); // but we dont have a way to find who is the logged in user so we kinda going to use the middleware here to know who the user actually is and we grab the user id and update the refreshToken field by removing it "" ez pz

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        // refreshToken: "",// good but undefined is better approach
        refreshToken: undefined,
      },
    },
    {
      // gives the new information fresh info instead of prev one
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

//Refresh Access Token functionality

const refreshAccessToken = asyncHandler(async (req, res) => {
  //STEP-1 -> assuming access token of user has been expired and got the status of 401 so coming to this route and we ask user to give me user refreshTOken so on the basis of that we can genetate the new accessToken for you

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken; // body parse for mobile as there's no cookie involved there just sent over the body onyl

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh Token Is Required");
  }

  // now in the user model under the section where we made the generateAccesstoken and refresh token we stored the id

  try {
    //decode the jwt token
    const decodedToken = jwt.verify(
      //token to verify
      incomingRefreshToken,
      //a secret that we used in the jwt
      process.env.REFRESH_TOKEN_SECRET
    );

    //If the token is decoded we have the access of the id
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh token ");
    }
    //Now we compare if this current refresh token that came from the user is equal to the refresh token present in the user object of the database --VALIDATION

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid Refresh Token or the token is expired");
    }

    // Validation done now generate a new token and send it to the user

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
    // cast new name for refreshToken for better naming -> helps during setting cookies
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Error while generating the new refresh token :(");
  }
});

export { registerUser, loginUser, refreshAccessToken, logoutUser };
