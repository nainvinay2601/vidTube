import mongoose, { Schema, Types } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
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
    fullName: {
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

  if (!this.isModified("password")) return next();  // this means if the password field is not being modified then just simply return and go to next middleware or end poitn  and for the first time we are saving it for the first time not modifying 
  this.password = bcrypt.hash(this.password, 10);

  next();
});

//Now we compare the password -> js prototype -> schema.methods.method 

userSchema.methods.isPasswordCorrect = async function(password)
{
  return await bcrypt.compare(password, this.password); //bool val return 
}


/*now what is the proof that user is logged in? or signedIn?
1. for that we need to generate some access token or refreshToken
-> we use the concept of stateless authentication -> making session with the use of the JWT tokens -> session strategy 

.. basically Access token and refresh token both are the auth token -> the access token we give user for a short period of time but the refresh token we keep it in the database for long time 
*/


//=======GENERATE TOKEN ============

userSchema.methods.generateAccessToken = function(){
  //short life access token 
  // string based on the info we have provided with the secret key and the time we have set too 
  return jwt.sign(
    {
      _id: this._id, 
      email: this.email, 
      username: this.username, 
      fullname: this.fullname
    }, 
    //here comes the secret key 
    process.env.ACCESS_TOKEN_SECRET, 
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
  )

}

/// we can force logout too on the basis of the refreshToken 
userSchema.methods.generateRefreshToken = function(){
  //long life access token 
  // string based on the info we have provided with the secret key and the time we have set too 
  return jwt.sign(
    {
      _id: this._id, 
    // we dont need all that info as we just want to save a single token to a user model and we just need id for that 
    }, 
    //here comes the secret key 
    process.env.REFRESH_TOKEN_SECRET, 
    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
  )

}



// if the User doc doesnt exist mongoose will create a Model called User based on userSchema
export const User = mongoose.model("User", userSchema); // now this User is not just an ordinary variable it has all the functionality to do stuff like find add all the crud operation and all the things will reflect in the database model of users (mongoDb define later in the collection as "lowercase plural" so User become users )
