import multer from "multer";

/*

-> diskStorage is a method in the multer which we will basically use to define the storage where we want to save the files that will be upload by the user in the multipart form 

-> destination -> tkaes a function a request and a file with a callback function that defines the path 
-> we should always reName or modify the file name while storing so the filename function is being used for 
-> atast we are exporting the upload to use the multer */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // public temp as our static file location is public defined in the app.js
  },
  // name of the file while saving in our diskStorage
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname); // .jpg, .png, etc.
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

export const upload = multer({
  storage, // storage:storage
});


// using all this we can take the file from the user and now we want to upload this file to the cloudinary -> we will do this by using utility function "cloudinary.js"
