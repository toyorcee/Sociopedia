import mongoose from "mongoose";
import User from "./models/User.js"; // Adjust according to your file structure
import Post from "./models/Post.js"; // Adjust according to your file structure
import dotenv from "dotenv";

dotenv.config();

const updatePostUserId = async () => {
  try {
    // Connect to MongoDB
    mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to database");
    // Fetch all posts
    const posts = await Post.find({}); // Assuming Post is your post model

    for (const post of posts) {
      // Find the user with a matching picturePath
      const user = await User.findOne({ picturePath: post.userPicturePath }); // Assuming User is your user model

      if (user) {
        // Update the post's userId with the user's _id
        await Post.findByIdAndUpdate(post._id, { userId: user._id });
        console.log(`Updated post ${post._id} with userId ${user._id}`);
      } else {
        console.log(
          `No matching user found for post ${post._id} with picturePath ${post.userPicturePath}`
        );
      }
    }

    console.log("Finished updating posts!");
  } catch (error) {
    console.error("Error updating posts:", error);
  }
};

updatePostUserId();
