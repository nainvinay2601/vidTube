import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({

    comment:{
        type:Schema.Types.ObjectId, 
        ref:"Comment"
    },
    video:{
        type:Schema.Types.ObjectId, 
        ref:"Video"
    },
    tweet:{
        type:Schema.Types.ObjectId, 
        ref:"Tweet"
    },
    likedBy:{
        type:Schema.Types.ObjectId, 
        ref:"User"
    },
   

}, { timestamps: true });

export const Like = mongoose.model("Like", likeSchema);
/*comment ObjectId comments
  video ObjectId videos 
  tweet ObjectId tweets 
  likedBy ObjectId users 
  createdAt Date
  updatedAt Date */