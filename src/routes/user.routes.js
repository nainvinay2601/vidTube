import { Router } from "express";
import {
  registerUser,
  logoutUser,
  loginUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getWatchHistory,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

//When someone makes a POST request to the /register URL, run the registerUser function"
//Unsecured route as they can be accessed by anyone
router.route("/register").post(
  // During the user registeration we want user to upload avatar image and the cover image and both will be handled by the multer
  // using the fields which will take an array of objects which are avatar object and the second is the coverIa
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

//secured routes

// router.route("/logout").post(logoutUser) -> this is not secured route as we still have to do the process using the middleware yet so we inject the middleware here

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile); //req.params thing here
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
// file route , we have handled the upload logic now we dont have to pass the array we can just upload the single item

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage); // "avatar"-> the controller sending reponse as avatar

// watch history route

router.route("/history").get(verifyJWT, getWatchHistory);

// the next we defined at the end of verifyJWT will transfer the control from the verifyJWT to endpoint which is our logoutUser controller

export default router;
