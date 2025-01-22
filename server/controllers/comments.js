import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

// Add a top level comment to a post
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) {
      console.error("[addComment] Comment text is missing.");
      return res.status(400).json({ message: "Comment text is required." });
    }

    // Create a new comment
    const newComment = await Comment.create({
      postId,
      userId,
      text,
      parentCommentId: null,
    });

    // Populate the user details (firstName, lastName, picturePath)
    const populatedComment = await newComment.populate(
      "userId",
      "firstName lastName picturePath"
    );

    // Update the post's comment count and comments array
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
      $push: { comments: newComment._id },
    });

    res.status(201).json({ comment: populatedComment });
  } catch (err) {
    console.error("[addComment] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Add a reply to a comment
export const addReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    // Find the parent comment
    const parentComment = await Comment.findById(commentId);
    if (!parentComment)
      return res.status(404).json({ message: "Comment not found" });

    // Create the new reply (which is a comment with parentCommentId)
    const newReply = await Comment.create({
      postId: parentComment.postId,
      parentCommentId: commentId,
      userId,
      text,
    });

    // Populate the user details (firstName, lastName, picturePath)
    const populatedReply = await newReply.populate(
      "userId",
      "firstName lastName picturePath"
    );

    // Push the new reply into the parent's replies array
    parentComment.replies.push(newReply._id);

    // Save the updated parent comment
    await parentComment.save();

    // Increment the reply count for the parent comment
    await Comment.findByIdAndUpdate(commentId, {
      $inc: { replyCount: 1 },
    });

    // Send back the newly created reply with populated user details
    res.status(201).json({ reply: populatedReply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all comments for a specific post
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!postId) {
      console.error("Error: postId is required.");
      return res.status(400).json({
        success: false,
        data: null,
        message: "postId is required.",
        errors: [],
      });
    }

    // Count total top-level comments
    const totalComments = await Comment.countDocuments({
      postId,
      parentCommentId: null,
    });

    // Fetch top-level comments
    const comments = await Comment.find({ postId, parentCommentId: null })
      .populate("userId", "firstName lastName picturePath")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const pagination = {
      totalComments,
      currentPage: Number(page),
      totalPages: Math.ceil(totalComments / limit),
    };

    return res.status(200).json({
      success: true,
      data: {
        comments: comments || [],
        pagination,
      },
      message: "Comments fetched successfully.",
      errors: [],
    });
  } catch (err) {
    console.error("Error in getComments Controller:", err.message);
    res.status(500).json({
      success: false,
      data: null,
      message: "An error occurred while fetching comments.",
      errors: [err.message],
    });
  }
};

// Get all reply comments for a specific Comment
export const getReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 3 } = req.query;

    if (!commentId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "commentId is required.",
        errors: [],
      });
    }

    // Count total replies for the comment
    const totalReplies = await Comment.countDocuments({
      parentCommentId: commentId,
    });

    // Fetch replies
    const replies = await Comment.find({ parentCommentId: commentId })
      .populate("userId", "firstName lastName picturePath")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const pagination = {
      totalReplies,
      currentPage: Number(page),
      totalPages: Math.ceil(totalReplies / limit),
    };

    console.log("GetReplies replies:", replies);

    return res.status(200).json({
      success: true,
      data: {
        replies: replies || [],
        pagination,
      },
      message: "Replies fetched successfully.",
      errors: [],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: "An error occurred while fetching replies.",
      errors: [err.message],
    });
  }
};

// Handle fetching more replies with pagination
// export const showMoreReplies = async (req, res) => {
//   try {
//     const { commentId } = req.params;
//     const { page = 1 } = req.query; // Page number to fetch additional replies
//     const repliesPerPage = 3;

//     if (!commentId) {
//       return res.status(400).json({
//         success: false,
//         data: null,
//         message: "commentId is required.",
//         errors: [],
//       });
//     }

//     // Fetch next page of replies
//     const replies = await Comment.find({ parentCommentId: commentId })
//       .populate("userId", "firstName lastName picturePath")
//       .sort({ createdAt: 1 })
//       .skip((page - 1) * repliesPerPage)
//       .limit(repliesPerPage);

//     // Check if more replies are available
//     const totalReplies = await Comment.countDocuments({
//       parentCommentId: commentId,
//     });
//     const hasMoreReplies = totalReplies > page * repliesPerPage;

//     res.status(200).json({
//       success: true,
//       data: {
//         replies: replies || [],
//         hasMoreReplies,
//       },
//       message: "Replies fetched successfully.",
//       errors: [],
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       data: null,
//       message: "An error occurred while fetching replies.",
//       errors: [err.message],
//     });
//   }
// };

// Like or unlike a comment
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id; // Get userId from middleware

    if (!commentId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "commentId is required.",
        errors: [],
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isLiked = comment.likes.includes(userId);
    if (isLiked) {
      // Remove like
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      comment.likeCount = Math.max((comment.likeCount || 0) - 1, 0);
    } else {
      // Add like
      comment.likes.push(userId);
      comment.likeCount = (comment.likeCount || 0) + 1;
    }

    // Update the like count on the parent post with a safeguard to not go below 0
    const post = await Post.findById(comment.postId);
    post.likeCount = Math.max((post.likeCount || 0) + (isLiked ? -1 : 1), 0);
    await post.save();

    await comment.save();
    res.status(200).json({
      success: true,
      data: comment,
      message: "Comment like status updated successfully.",
      errors: [],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: "An error occurred while updating comment like status.",
      errors: [err.message],
    });
  }
};

// Like or unlike a reply
export const likeReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;

    const reply = await Comment.findById(replyId);
    if (!reply || !reply.parentCommentId) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Reply not found.",
        errors: [],
      });
    }

    const isLiked = reply.likes.includes(userId);
    if (isLiked) {
      // If already liked, remove like
      reply.likes = reply.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      reply.likeCount = Math.max((reply.likeCount || 0) - 1, 0);
    } else {
      // If not liked, add like
      reply.likes.push(userId);
      reply.likeCount = (reply.likeCount || 0) + 1;
    }

    await reply.save();

    res.status(200).json({
      success: true,
      data: reply,
      message: "Reply like status updated successfully.",
      errors: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: "An error occurred while updating reply like status.",
      errors: [error.message],
    });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!commentId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Comment ID is required.",
        errors: [],
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Comment not found.",
        errors: [],
      });
    }

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "You can only delete your own comments.",
        errors: [],
      });
    }

    const post = await Post.findById(comment.postId);

    // Delete the comment and its replies
    const deletedComments = await Comment.deleteMany({
      $or: [{ _id: commentId }, { parentCommentId: commentId }],
    });

    if (post) {
      // Reduce post comment count, ensuring it does not go below 0
      post.commentCount = Math.max(
        (post.commentCount || 0) - deletedComments.deletedCount,
        0
      );
      await post.save();
    }

    const updatedComments = await Comment.find({ postId: comment.postId });

    res.status(200).json({
      success: true,
      data: { comments: updatedComments },
      message: "Comment deleted successfully.",
      errors: [],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: "An error occurred while deleting the comment.",
      errors: [err.message],
    });
  }
};

// Delete a reply
export const deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;

    if (!replyId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Reply ID is required.",
        errors: [],
      });
    }

    // Fetch the reply
    const reply = await Comment.findById(replyId);
    if (!reply || !reply.parentCommentId) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Reply not found.",
        errors: [],
      });
    }

    // Check if the user owns the reply
    if (reply.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "You can only delete your own replies.",
        errors: [],
      });
    }

    // Fetch the parent comment
    const parentComment = await Comment.findById(reply.parentCommentId);

    // Delete the reply
    await reply.deleteOne();

    if (parentComment) {
      // Reduce the reply count for the parent comment, ensuring it doesn't go below 0
      parentComment.replyCount = Math.max(
        (parentComment.replyCount || 0) - 1,
        0
      );
      await parentComment.save();
    }

    // Fetch updated replies for the parent comment
    const updatedReplies = await Comment.find({
      parentCommentId: reply.parentCommentId,
    });

    res.status(200).json({
      success: true,
      data: { replies: updatedReplies },
      message: "Reply deleted successfully.",
      errors: [],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: "An error occurred while deleting the reply.",
      errors: [err.message],
    });
  }
};
