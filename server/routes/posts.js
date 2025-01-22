import express from "express";
import {
  deletePost,
  editPost,
  getFeedPosts,
  getUserPosts,
  likePost,
} from "../controllers/posts.js";
import {
  addComment,
  getComments,
  likeComment,
  deleteComment,
  getReplies,
  addReply,
  likeReply,
  deleteReply,
  // showMoreReplies,
} from "../controllers/comments.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// ===================== POST ROUTES =====================

// READ
router.get("/", verifyToken, getFeedPosts); // Fetch all posts (Feed)

router.get("/:userId/posts", verifyToken, getUserPosts); // Fetch posts of a specific user

// UPDATE
router.patch("/:id", verifyToken, editPost); // Edit a post's content

router.patch("/:id/like", verifyToken, likePost); // Like a post

// DELETE
router.delete("/:id", verifyToken, deletePost); // delete a post

// ===================== COMMENT ROUTES =====================

// CREATE
router.post("/:postId/comments", verifyToken, addComment); // add a comment

// READ
router.get("/:postId/comments", verifyToken, getComments); // Get all comments for a post

// UPDATE
router.patch("/comments/:commentId/like", verifyToken, likeComment); // Like a specific comment

// DELETE
router.delete("/comments/:commentId/delete", verifyToken, deleteComment); // Delete a specific comment


// ========================== REPLY ROUTES ==========================

// CREATE
router.post("/:postId/comments/:commentId/replies", verifyToken, addReply); // Reply to a comment

// READ
router.get("/:postId/comments/:commentId/replies", verifyToken, getReplies); // Get replies for a comment

// READ
// router.get("/comments/:commentId/replies/showMore", verifyToken, showMoreReplies) // Show more replies for a specific comment (pagination for additional replies)

// UPDATE
router.patch("/:postId/comments/:commentId/replies/:replyId/like", verifyToken, likeReply); // Like a specific reply

// DELETE
router.delete("/:postId/comments/:commentId/replies/:replyId/delete", verifyToken, deleteReply); // Delete a specific reply


export default router;
