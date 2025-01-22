import mongoose from "mongoose";
import Post from "./models/Post.js";
import Comment from "./models/Comment.js";
import dotenv from "dotenv";

dotenv.config();

const cleanAndAdjustCommentCounts = async () => {
  try {
    console.log("Connecting to MongoDB...");

    // Connect to MongoDB
    mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB.");

    // Step 1: Clean up and verify comment-reply relationships for each post
    const posts = await Post.find({});

    for (const post of posts) {
      // Get all comments for the current post
      const comments = await Comment.find({ postId: post._id });

      let totalCommentCount = 0;
      let totalRepliesCount = 0;

      // Get all valid comment IDs from the post
      const validCommentIds = comments.map((comment) => comment._id.toString());

      // Step 2: Log the post's comment count and the comment IDs inside the array
      console.log(`Post ID: ${post._id}`);
      console.log(`Comment count for the post: ${post.commentCount}`);
      console.log(`Total IDs inside comments array: ${post.comments.length}`);

      // Step 3: Filter the comment IDs in the post to ensure they are valid
      const validCommentsInPost = post.comments.filter(
        (commentId) => validCommentIds.includes(commentId.toString()) // Check if the comment ID exists in the Comment model
      );

      // Step 4: Update the post's comments array with only valid comment IDs
      if (validCommentsInPost.length !== post.comments.length) {
        await Post.findByIdAndUpdate(post._id, {
          $set: { comments: validCommentsInPost },
        });
        console.log(`Updated comments array for Post ID: ${post._id}`);
      }

      // Step 5: Check replies for each comment and adjust counts
      for (const comment of comments) {
        totalCommentCount++;

        // Log the reply count for each comment
        console.log(`  Comment ID: ${comment._id}`);
        console.log(`  Reply count: ${comment.replyCount}`);
        console.log(
          `  Total IDs inside replies array: ${comment.replies.length}`
        );

        // Add to the total replies count
        totalRepliesCount += comment.replies.length;

        // Ensure the correct IDs are in the replies array
        const validReplies = comment.replies.filter((replyId) =>
          mongoose.Types.ObjectId.isValid(replyId)
        );

        // Update the replies array with valid IDs only
        if (validReplies.length !== comment.replies.length) {
          await Comment.findByIdAndUpdate(comment._id, {
            $set: { replies: validReplies },
          });
        }

        // Ensure replyCount is equal to the number of valid replies
        if (comment.replyCount !== validReplies.length) {
          await Comment.findByIdAndUpdate(comment._id, {
            $set: { replyCount: validReplies.length },
          });
          console.log(`Updated replyCount for Comment ID: ${comment._id}`);
        }
      }

      // Step 6: Ensure that the post's comment count is the combination of comments and replies
      const newCommentCount = totalCommentCount + totalRepliesCount;
      await Post.findByIdAndUpdate(post._id, {
        $set: { commentCount: newCommentCount },
      });

      console.log(`Updated post comment count: ${newCommentCount}`);
    }

    console.log("Clean-up and adjustment completed successfully.");
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

cleanAndAdjustCommentCounts();
