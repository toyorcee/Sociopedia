import Comment from "./models/Comment.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const resetCountAndReplies = async (commentId) => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB.");

    const updatedComment = await Comment.findOneAndUpdate(
      { _id: commentId },
      { $set: { replyCount: 0, replies: [] } },
      { new: true }
    );

    if (updatedComment) {
      console.log(
        `Reset comment to ${
          updatedComment.replies?.length || 0
        } replies & replyCount to ${updatedComment.replyCount || 0}`
      );
    }
  } catch (error) {
    console.error("Error resetting count and replies:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

// Call the function
const commentId = "67741a4be686b2546987a17e";
resetCountAndReplies(commentId);
