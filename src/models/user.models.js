import mongoose, { Schema, Types } from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new Schema(
  {
    // add the fields here
    // username : String,  -> one way of defining but some things are required and so that we can actually introduce the object instead of just type to store more info

    username: {
      type: String, // type of username -> string
      required: true, // is this field required? yes
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // field can help us find pretty easily
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String, // cloudinary url or aws url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url or aws url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video", // Video model -> we reffer using this only not the videoSchema no nothing just the name of model like if We want to use the objectID of user we will use the "User"  the model name of users
      },
    ], // as we know this particular thing is going to be array associated with other model (videos)
    password: {
      type: String, // encrypted string that we will save after using the middleware and use the bcrypt to salt it
      required: [true, "Password Is Required :("],
    },
    refreshTOken: {
      type: String,
    },
  },
  {
    timestamps: true, // this one for createdAt and updatedAt
  }
);
// ? so basically we dont add controlling functionality in the data model we mostly add in the controller -> but in some case we need to add them in the data model as the functionality is closely attached to the data and one such case of functionality is encryption of the password

// we will encrypt using bcrypt -> this will be done by preHook of the mongoose and fall in the category of the middleware

userSchema.pre("save", async function (next) {
  // this has access to all the info of the userSchema
  // this.passowrd means user's given password

  if (!this.modified("password")) return next();  // this means if the password field is not being modified then just simply return and go to next middleware or end poitn  and for the first time we are saving it for the first time not modifying 
  this.password = bcrypt.hash(this.password, 10);

  next();
});

// if the User doc doesnt exist mongoose will create a Model called User based on userSchema
export const User = mongoose.model("User", userSchema); // now this User is not just an ordinary variable it has all the functionality to do stuff like find add all the crud operation and all the things will reflect in the database model of users (mongoDb define later in the collection as "lowercase plural" so User become users )
