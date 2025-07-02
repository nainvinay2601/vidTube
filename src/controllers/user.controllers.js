import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

//Change the password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  //Steps-> grab old password and new password
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "No User found");
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(404, "Old Password is incorrect ");
  }

  // old password was correct so update the user password with the bew pasword
  user.password = newPassword; // as we have already used the prehook of mongoose in the user model when the password is modified it will be hashed first and saved in the db

  await User.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully :)"));
});

//Get current user -> user already stored in the request all thanks to auth middleware
const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, "Current User Details"));
});

//update account details

const updateAccountDetails = asyncHandler(async (req, res) => {
  //what kind of data we are allowing user to edit like if we are allowing user to update email or not like that
  const { fullname, email } = req.body;
  //validate
  if (!fullname || !email) {
    throw new ApiError(404, "Fullname and email are required to change em:(");
  }
  // Validation done now we want to find the id and update the fullname or email whatever user want to update
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Account Details updated successfully :))")
    );
});

//Update User avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  //Grab Images
  //access local file path by using.files method that multer help us to set

  const avatarLocalPath = req.file?.path;
  //Validate
  if (!avatarLocalPath) {
    throw new ApiError(404, "Avatar File is required");
  }

  //upload on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  //response will be send using the url as we mentuoned in the utils of cloudinary

  //validate the url
  if (!avatar.url) {
    throw new ApiError(500, "Error while uploading the avatar  :((");
  }

  //validated now again find by id and update and return

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  res.status(200).json(new ApiResponse(200, user, "Avatar updated"));
});
//update cover image
const updateUserCoverImage = asyncHandler(async (req, res) => {
  //Grab Images
  //access local file path by using.files method that multer help us to set

  const coverLocalPath = req.file?.path;
  //Validate
  if (!coverLocalPath) {
    throw new ApiError(404, "Cover File is required");
  }

  //upload on cloudinary
  const coverImage = await uploadOnCloudinary(coverLocalPath);

  //response will be send using the url as we mentuoned in the utils of cloudinary

  //validate the url
  if (!coverImage.url) {
    throw new ApiError(500, "Error while uploading the cover Image  :((");
  }

  //validated now again find by id and update and return

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  res.status(200).json(new ApiResponse(200, user, "Cover Image updated"));
});

//Get user profile channel -> how many people have subscribed you or how many you have subscribed how many tweets you have done this and that

const getUserChannelProfile = asyncHandler(async (req, res) => {
  //Step -1 -> get something from req.params
  const { username } = req.params;
  //validate
  if (!username?.trim()) {
    throw new ApiError(404, "Username is required");
  }

  //now use this username to enquire from db
  const channel = await User.aggregate([
    {
      //Pipeline one
      $match: {
        //match based on field -> filter the database based on this username and find the user
        username: username?.toLowerCase().trim(),
      },
    },
    {
      //the match we found will be used here now
      // next agreegation thing we gonna use is the lookup method to look for collection of the username
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        // all the channels that have my ID are my subscriber only so we are finding the channels here
        foreignField: "channel",
        as: "subscribers", // all my subscribers
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber", // all the channels where I have subscribed to
        as: "subscribedTo",
      },
    },
    {
      // add our fields now
      $addFields: {
        subscribersCount: {
          $size: "$subscriber", // use $ sign when you actually named something
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              // in our lookup do any subscriber has our id means he is logged in or nit
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      //projection of necessary data
      $project: {
        fullname: 1,
        avatar: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  //validate channel
  if (!channel?.length) {
    throw new ApiError(404, "No Channel Found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channel[0],
        "Channel profile fetched successfully :)"
      )
    );
});
//Get user watch history
const getWatchHistory = asyncHandler(async (req, res) => {
  //get user from params or directly from request both gonna give user only

  const user = await User.aggregate([
    {
      $match: {
        // _id:req.user?._id this dont work in the aggregate like that, here we have to give mongoose defined id like this
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchedHistory", // saving the watchHistory as watchHistory in our db
        pipeline: [
          {
            $lookup: {
              // we are doing lookup now as when we are in this "videos" model we want to know some details about the video like we also want to get the videoFile, the creator of the video and all such info
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner", // saving the owner of the video as owner
              // now we have grabbed the user based on the foreign id which is id now we have option to project all the data of the owner like fullname, password refreshtoken all the thing but we just want to show/project a few specific things only
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,

                    // now videos will only have access to these fields of user
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.watchHistory,
        "Watch History fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
