import mongoose from "mongoose";
import Post from "./models/Post.js";
import Comment from "./models/Comment.js";
import dotenv from "dotenv";

dotenv.config();

const getTotalCommentsAndReplies = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to database");

    // Step 1: Flush all comments and replies (delete all comments)
    const deletedComments = await Comment.deleteMany({}); // Delete all comments and replies in the database
    console.log(`Flushed ${deletedComments.deletedCount} comments and replies`);

    // Step 2: Reset all fields in the Post model that should be cleared
    const updatedPosts = await Post.updateMany(
      {}, // No filter to target all posts
      {
        $set: {
          likeCount: 0, // Reset like count
          commentCount: 0, // Reset comment count
          likes: [], // Clear the likes array
          comments: [], // Clear the comments array
        },
      }
    );
    console.log(
      `Reset likeCount, commentCount, likes, and comments for ${updatedPosts.modifiedCount} posts`
    );

    // Step 3: Reset all fields in the Comment model that should be cleared
    const updatedComments = await Comment.updateMany(
      {}, // No filter to target all comments
      {
        $set: {
          likeCount: 0, // Reset like count
          replyCount: 0, // Reset reply count
          likes: [], // Clear the likes array
          replies: [], // Clear the replies array
        },
      }
    );
    console.log(
      `Reset likeCount, replyCount, likes, and replies for ${updatedComments.modifiedCount} comments`
    );

    console.log(
      "Flushing comments and resetting counts completed successfully!"
    );
    process.exit(); // Exit the script
  } catch (err) {
    console.error("Error flushing comments and resetting counts:", err);
    process.exit(1);
  }
};

getTotalCommentsAndReplies();
