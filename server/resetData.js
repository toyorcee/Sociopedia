import Comment from "./models/Comment.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const resetCountAndReplies = async (commentId) => {
  try {
    console.log("Connecting to MongoDB...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB.");

    // Reset the replies array and replyCount for the given comment
    const updatedComment = await Comment.findOneAndUpdate(
      { _id: commentId }, // Query object to match the comment by its ID
      { $set: { replyCount: 0, replies: [] } }, // Update replyCount and replies
      { new: true } // Return the updated document
    );

    if (updatedComment) {
      console.log(
        `Reset comment to ${updatedComment.replies?.length || 0} replies & replyCount to ${updatedComment.replyCount || 0}`
      );
    } else {
      console.log("Comment not found!");
    }
  } catch (error) {
    console.error("Error resetting count and replies:", error);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

// Test the function
const commentId = "67741a4be686b2546987a17e";
resetCountAndReplies(commentId);
