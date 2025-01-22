import mongoose from "mongoose";
import Comment from "./models/Comment.js"; // Adjust the import according to your setup
import dotenv from "dotenv";

dotenv.config(); // Load your environment variables
const initializereplyCount = async () => {
  try {
    // Connect to MongoDB
    mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to database");

    // Fetch all comments
    const comments = await Comment.find();

    // Iterate through each comment and calculate reply count
    for (const comment of comments) {
      const replyCount = await Comment.countDocuments({
        parentCommentId: comment._id,
      });
      comment.replyCount = replyCount; // Update the replyCount field
      await comment.save(); // Save the updated comment
    }

    console.log("Reply count initialization completed");
    process.exit(); // Exit the script after processing all comments
  } catch (err) {
    console.error("Error initializing reply counts:", err);
    process.exit(1);
  }
};

initializereplyCount();
