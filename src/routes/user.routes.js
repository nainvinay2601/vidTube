import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

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

export default router;
