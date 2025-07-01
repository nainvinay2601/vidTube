import { Router } from "express";
import { registerUser, logoutUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

//When someone makes a POST request to the /register URL, run the registerUser function"
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

//secured routes

// router.route("/logout").post(logoutUser) -> this is not secured route as we still have to do the process using the middleware yet so we inject the middleware here

router.route("/logout").post(verifyJWT, logoutUser);

// the next we defined at the end of verifyJWT will transfer the control from the verifyJWT to endpoint which is our logoutUser controller 

export default router;
