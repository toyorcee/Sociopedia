import mongoose from "mongoose";
import Comment from "./models/Comment.js"; // Adjust the import according to your setup
import dotenv from "dotenv";

dotenv.config(); // Load your environment variables

const populateReplies = async () => {
  try {
    // Connect to MongoDB
    mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to database");

    // Fetch all comments
    const comments = await Comment.find();

    // Map to store replies by parentCommentId
    const repliesMap = new Map();

    // Organize replies by parentCommentId
    for (const comment of comments) {
      if (comment.parentCommentId) {
        if (!repliesMap.has(comment.parentCommentId)) {
          repliesMap.set(comment.parentCommentId, []);
        }
        repliesMap.get(comment.parentCommentId).push(comment);
      }
    }

    // Populate replies and update comments
    for (const comment of comments) {
      if (!comment.replies) {
        comment.replies = [];
      }

      const replies = repliesMap.get(comment._id) || [];
      comment.replies = replies; // Add replies to the comment
      comment.replyCount = replies.length; // Update the replyCount field
      await comment.save(); // Save the updated comment
    }

    console.log("Replies population and reply count update completed");
    process.exit(); // Exit the script after processing all comments
  } catch (err) {
    console.error("Error populating replies and updating reply counts:", err);
    process.exit(1);
  }
};

populateReplies();
