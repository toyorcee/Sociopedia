import mongoose from "mongoose";
import Comment from "./models/Comment.js";
import Reply from "./models/Reply.js";
import Post from "./models/Post.js";
import dotenv from "dotenv";

dotenv.config();

const migrateRepliesAndUpdateLikes = async () => {
  try {
    // Connect to MongoDB
    mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to database");

    const replies = await Reply.find();
    let skippedReplies = 0;

    for (const reply of replies) {
      if (!reply.postId) {
        // Skipping and deleting replies without postId
        const replyId = reply._id;

        // Update parent comment (decrement reply count)
        if (reply.commentId) {
          await Comment.findByIdAndUpdate(
            reply.commentId,
            { $pull: { replies: replyId }, $inc: { replyCount: -1 } },
            { new: true }
          );
        }

        // Update parent post (decrement comment count)
        if (reply.postId) {
          await Post.findByIdAndUpdate(reply.postId, {
            $inc: { commentCount: -1 },
          });
        }

        // Delete the reply
        await Reply.findByIdAndDelete(replyId);
        skippedReplies++;
        continue; // Skip to the next reply
      }

      // Migrate valid replies into Comment
      const newComment = new Comment({
        postId: reply.postId,
        userId: reply.userId,
        parentCommentId: reply.commentId,
        text: reply.text,
        likes: reply.likes instanceof Map ? Array.from(reply.likes.keys()) : [], // Convert Map to Array
        likeCount:
          reply.likes instanceof Map
            ? Array.from(reply.likes.keys()).length
            : 0,
        replyCount: 0,
      });

      await newComment.save();

      // Increment reply count in the parent comment
      if (reply.commentId) {
        await Comment.findByIdAndUpdate(reply.commentId, {
          $inc: { replyCount: 1 },
        });
      }

      // Increment the comment count in the post
      await Post.findByIdAndUpdate(reply.postId, { $inc: { commentCount: 1 } });
    }

    console.log(
      `Replies migrated. Skipped and deleted ${skippedReplies} invalid replies.`
    );

    // Update likes in the existing Comment collection
    const comments = await Comment.find();
    for (const comment of comments) {
      if (comment.likes instanceof Map) {
        // Convert Map to Array of ObjectIds (User references)
        comment.likes = Array.from(comment.likes.keys());
        comment.likeCount = comment.likes.length;
        await comment.save();
      }
    }

    // Update likes in the existing Post collection
    const posts = await Post.find();
    for (const post of posts) {
      if (post.likes instanceof Map) {
        // Convert Map to Array of ObjectIds (User references)
        post.likes = Array.from(post.likes.keys());
        post.likeCount = post.likes.length;
        await post.save();
      }
    }

    console.log("Likes migration and update completed.");
    process.exit();
  } catch (err) {
    console.error("Error during migration:", err);
    process.exit(1);
  }
};

migrateRepliesAndUpdateLikes();
