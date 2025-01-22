import mongoose from "mongoose";
import Post from "./models/Post.js";
import Comment from "./models/Comment.js";
import Reply from "./models/Reply.js";
import dotenv from "dotenv";

dotenv.config();

const resetPostData = async () => {
  try {
    console.log("Connecting to MongoDB...");

    // Connect to MongoDB
    mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB.");
    // Clear posts, comments, and replies
    console.log("Flushing posts, comments, and replies...");

    await Post.deleteMany({}); // Deletes all posts
    await Comment.deleteMany({}); // Deletes all comments and replies
    await Reply.deleteMany({}); // Explicitly clear the replies collection

    console.log("All posts, comments, and replies have been flushed.");
  } catch (error) {
    console.error("Error occurred during flushing data:", error);
  } finally {
    // Disconnect from the database after the migration
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

resetPostData();
