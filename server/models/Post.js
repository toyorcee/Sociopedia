import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    location: String,
    description: String,
    picturePath: String,
    userPicturePath: String,
    likes: {
      type: [mongoose.Schema.Types.ObjectId], // Array of ObjectIds
      ref: "User",
      default: [], // Ensure it defaults to an empty array
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true }
);

postSchema.index({ description: "text", location: "text" });

const Post = mongoose.model("Post", postSchema);
export default Post;
