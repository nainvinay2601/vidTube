import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Playlist Name Is Required :("],
    },
    description: {
      type: string,
    },

    videos: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);

/* name string 
  description string 
  createdAt Date 
  UpdatedAt Date 
  videos ObjectId[] videos 
  owner ObjectId users */
