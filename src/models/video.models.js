import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
  {
    videoFile: {
      type: String, //cloudinary url
      required: [true, "Video File Is Required :("],
    },
    thumbnail: {
      type: String, //cloudinary url
      required: [true, "Thumbnail Is Required :("],
    },
    title: {
      type: String,
      required: [true, "Title Is Required :("],
    },
    description: {
      type: String,
      // required:[true, "Description Is Required :("]
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);
videoSchema.plugin(mongooseAggregatePaginate);

//

export const Video = mongoose.model("Video", videoSchema);
