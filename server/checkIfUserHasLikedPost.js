import mongoose from "mongoose";
import Post from "./models/Post.js";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const checkIfUserHasLikedPost = async (userId, postId) => {
  try {
    console.log("Connecting to MongoDB...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB.");

    // Step 1: Find the post by postId
    const post = await Post.findById(postId);
    if (!post) {
      console.log(`Post not found with ID: ${postId}`);
      return;
    }

    // Step 2: Check if the userId exists in the likes array of the post
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      console.log(
        `User ID ${userId} has already liked the post with ID ${postId}`
      );
    } else {
      console.log(`User ID ${userId} has NOT liked the post with ID ${postId}`);
    }
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

// Example Usage: Checking if the user with ID '6735f38ac37056ed9db10fe4' has liked the post with ID '674059c492332a3fb21719eb'
const userId = "6735f38ac37056ed9db10fe4"; // This would be from the request
const postId = "674059c492332a3fb21719eb"; // This is the post ID you are checking
checkIfUserHasLikedPost(userId, postId);
