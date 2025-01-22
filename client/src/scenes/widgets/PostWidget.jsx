import { useCallback, useEffect, useRef, useState } from "react";
import { createSelector } from "reselect";
import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
  EditOutlined,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  IconButton,
  Typography,
  Modal,
  TextField,
  Button,
  useTheme,
  CircularProgress,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import DeleteIcon from "@mui/icons-material/Delete";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CloseIcon from "@mui/icons-material/Close";
import { useSpring, animated } from "react-spring";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  setPost,
  optimisticLikePost,
  confirmLikePost,
  failLikePost,
  optimisticLikeComment,
  confirmLikeComment,
  failLikeComment,
  setComments,
  optimisticAddComment,
  confirmAddComment,
  failAddComment,
  optimisticAddReply,
  confirmAddReply,
  failAddReply,
  failDeleteComment,
  confirmDeleteComment,
  optimisticDeleteComment,
  optimisticDeleteReply,
  confirmDeleteReply,
  failDeleteReply,
  setReplies,
  clearCommentsCache,
  optimisticLikeReply,
  confirmLikeReply,
  failLikeReply,
} from "state";
import moment from "moment";
import "styles/PostWidget.css";
import UserImage from "components/UserImage";

const PostWidget = ({ post }) => {
  const {
    _id: postId,
    userId: postUserId,
    firstName,
    lastName,
    location,
    description,
    picturePath,
    userPicturePath,
    commentCount: initialCommentCount,
    likes: initialLikes,
    createdAt,
    updatedAt,
  } = post;

  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newDescription, setNewDescription] = useState(description || "");
  const [newLocation, setNewLocation] = useState(location || "");
  const [loadingLike, setLoadingLike] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [scrollToTop, setScrollToTop] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [highlightedComment, setHighlightedComment] = useState(null);
  const [highlightedReply, setHighlightedReply] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const topRef = useRef();
  const [replyState, setReplyState] = useState({
    parentCommentId: null,
    isReplying: false,
    newReply: "",
  });
  const state = useSelector((state) => state);
  const replyInputRef = useRef(null);
  const postFromState = useSelector((state) => state.posts?.[postId]);
  // const repliess = useSelector((state) => state.replies);
  // console.log("state replies", repliess);

  //Get cached comments data
  const cachedCommentData = state.comments?.[postId];

  // Dynamically derive commentCount and likes
  const commentCount =
    cachedCommentData?.pagination?.totalComments ||
    postFromState?.commentCount ||
    initialCommentCount;
  const likes = postFromState?.likes || initialLikes || {};
  const loggedInUserId = useSelector((state) => state.user._id);
  const user = useSelector((state) => state.user);

  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;

  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;

  // Get fetchedComments and totalComments for pagination.
  const fetchedComments = cachedCommentData?.commentOrder?.length || 0;
  const totalComments = cachedCommentData?.pagination?.totalComments || 0;

  const selectCachedCommentData = () => cachedCommentData;

  // Get all comments for a specific post
  const getCommentsByPost = createSelector(
    [selectCachedCommentData, (_, postId) => postId],
    (cachedCommentData, postId) => {
      const postComments = cachedCommentData?.data || {};
      const commentOrder = cachedCommentData?.commentOrder || [];

      // console.log("Comment Order:", commentOrder);
      // console.log("Post Comments:", postComments);

      return commentOrder.map((id) => postComments[id]).filter(Boolean);
    }
  );

  // Usage in components
  const comments = useSelector((state) => getCommentsByPost(state, postId));

  // Get all replies for a specific comment
  const selectRepliesForComment = (state, commentId) =>
    state.replies[commentId] || { data: {}, replyOrder: [] };

  const getRepliesByComment = createSelector(
    [selectRepliesForComment],
    (commentReplies) => {
      const replyOrder = commentReplies.replyOrder || [];
      const replies = replyOrder
        .map((id) => commentReplies.data[id])
        .filter(Boolean);

      // console.log("Memoized Replies:", replies);

      return {
        data: replies,
        pagination: commentReplies.pagination || {
          currentPage: 1,
          totalPages: 0,
        },
      };
    }
  );

  const selectRepliesByCommentId = createSelector(
    [(state) => state, (_, comments) => comments],
    (state, comments) =>
      comments.reduce((acc, comment) => {
        acc[comment._id] = getRepliesByComment(state, comment._id);
        return acc;
      }, {})
  );

  const repliesByCommentId = useSelector((state) =>
    selectRepliesByCommentId(state, comments)
  );

  // Comments pagination
  const commentsPagination = useSelector(
    (state) =>
      state.comments[postId]?.pagination || {
        currentPage: 1,
        totalPages: 0,
        totalComments: 0,
      }
  );

  const repliesPagination = useSelector((state) => {
    // Log to debug if this selector is working correctly
    return (commentId) =>
      state.replies[commentId]?.pagination || {
        currentPage: 1,
        totalPages: 0,
        totalReplies: 0,
      };
  });

  // Define the selector function properly outside of the component
  const selectRepliesPagination = (state, commentId) =>
    state.replies[commentId]?.pagination || {
      currentPage: 1,
      totalPages: 0,
      totalReplies: 0,
    };

  // Animation for post
  const postAnimationProps = useSpring({
    opacity: 1,
    transform: "translateY(0)",
    from: { opacity: 0, transform: "translateY(50px)" },
    config: { tension: 250, friction: 25 },
  });

  // Animation for modal to slide up from bottom
  const modalAnimationProps = useSpring({
    opacity: isCommentsModalOpen || isEditModalOpen ? 1 : 0,
    transform:
      isCommentsModalOpen || isEditModalOpen
        ? "translateY(0)"
        : "translateY(100%)",
    config: { tension: 200, friction: 20 },
  });

  const openModal = (postId, dispatch, comments) => {
    const cachedComments = comments[postId];
    const cacheDuration = 5 * 60 * 1000; // Cache valid for 5 minutes
    const isCacheValid =
      cachedComments && Date.now() - cachedComments.lastFetched < cacheDuration;

    if (!isCacheValid) {
      // Clear stale cache if invalid
      dispatch(clearCommentsCache({ postId }));
    }

    // Open the modal
    setIsCommentsModalOpen(true);
  };

  const handleReplyInputToggle = (commentId) => {
    if (!commentId) return; // Check if commentId is valid

    setReplyState((prevState) => {
      // If the same comment is being replied to, toggle off (Cancel)
      if (prevState.parentCommentId === commentId && prevState.isReplying) {
        return {
          parentCommentId: null,
          isReplying: false,
          newReply: "",
        };
      }
      // Otherwise, activate reply for the current comment
      return {
        parentCommentId: commentId,
        isReplying: true,
        newReply: "",
      };
    });

    setShowReplyInput(commentId); // Show reply input for this comment
  };

  const patchLike = async (postId) => {
    setLoadingLike(true);
    setError(null);

    if (!postFromState) {
      console.error("Post not found in state:", postId);
      toast.error("Post not found");
      setError("Post not found.");
      return;
    }

    const cleanedLikes =
      postFromState.likes?.filter((like) => like !== null) || [];
    const isLiked = cleanedLikes.includes(loggedInUserId);
    console.log("patchLike - isLiked:", isLiked);

    // Optimistic update
    dispatch(optimisticLikePost({ postId, userId: loggedInUserId, isLiked }));

    const apiUrl = `http://localhost:5000/posts/${postId}/like`;
    console.log("patchLike - API URL:", apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to update like.");
      }

      const updatedPost = responseData;
      dispatch(confirmLikePost({ postId, updatedPost }));
      dispatch(setPost({ post: updatedPost }));

      // Trigger bubble effect when the like is successful
      setShowBubble(true);
      setTimeout(() => {
        setShowBubble(false); // Hide bubble after animation
      }, 1500); // Matches the duration of the animation
    } catch (err) {
      console.error("An error occurred:", err.message);
      toast.error(err.message || "Error while updating like.");
    } finally {
      setLoadingLike(false);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/posts/${postId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: newDescription,
          location: newLocation,
        }),
      });

      if (!response.ok) {
        const errorText = await response.json(); // Parse JSON error response
        throw new Error(
          errorText.message || "An error occurred while updating the post."
        );
      }

      const updatedPost = await response.json();
      dispatch(setPost({ post: updatedPost }));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(
        "An error occurred while updating the post.:",
        error.message
      );
      setError(error.message || "An error occurred while updating the post.");
      toast.error(
        error.message || ".An error occurred while updating the post."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) {
      console.error("[handleAddComment] Comment text is empty.");
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;

    const commentPayload = {
      text: newComment,
      parentId: null,
    };

    if (!loggedInUserId) {
      console.error("[handleAddComment] User is not logged in.");
      return;
    }

    const optimisticComment = {
      id: tempId,
      text: newComment,
      parentId: null,
      replies: [],
      pending: true,
      user,
    };

    // Dispatch optimistic comment
    dispatch(optimisticAddComment({ postId, comment: optimisticComment }));
    setNewComment("");
    setHighlightedComment(tempId);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:5000/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(commentPayload),
        }
      );

      if (!response.ok)
        throw new Error(
          (await response.json()).message || "Failed to add comment."
        );

      const newCommentData = await response.json();
      dispatch(
        confirmAddComment({
          postId,
          tempId,
          confirmedComment: { ...newCommentData.comment, user },
        })
      );

      setNewComment(""); // Clear comment input
      toast.success("Comment added successfully!");
    } catch (err) {
      dispatch(failAddComment({ postId, tempId, user }));
      toast.error(err.message || "Failed to add comment.");
    } finally {
      setLoading(false);
    }
  }, [
    newComment,
    loggedInUserId,
    token,
    dispatch,
    postId,
    user,
    setNewComment,
    setHighlightedComment,
    setLoading,
    setError,
    confirmAddComment,
    failAddComment,
  ]);

  const handleReplyComment = async () => {
    if (!replyState.newReply.trim()) {
      console.error("[handleReplyComment] Reply text is empty.");
      return;
    }

    const tempReplyId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;

    const replyPayload = {
      text: replyState.newReply,
      parentId: replyState.parentCommentId,
    };

    if (!loggedInUserId) {
      console.error("[handleReplyComment] User is not logged in.");
      return;
    }

    const optimisticReply = {
      _id: tempReplyId,
      text: replyState.newReply,
      parentId: replyState.parentCommentId,
      pending: true,
      user,
    };

    // Dispatch optimistic reply
    dispatch(
      optimisticAddReply({
        commentId: replyState.parentCommentId,
        reply: optimisticReply,
      })
    );

    setHighlightedReply(tempReplyId);
    setReplyState((prevState) => ({
      ...prevState,
      newReply: "",
    }));
    setTimeout(() => setHighlightedReply(null), 2000);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:5000/posts/${postId}/comments/${replyState.parentCommentId}/replies`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(replyPayload),
        }
      );

      if (!response.ok)
        throw new Error(
          (await response.json()).message || "Failed to add reply."
        );

      const newReplyData = await response.json();
      console.log("[handleReplyComment] Confirmed Reply:", newReplyData);

      dispatch(
        confirmAddReply({
          commentId: replyState.parentCommentId,
          tempId: tempReplyId,
          confirmedReply: { ...newReplyData.reply, user },
        })
      );

      setReplyState({ parentCommentId: null, isReplying: false, newReply: "" });
      toast.success("Reply added successfully!");
    } catch (err) {
      dispatch(
        failAddReply({
          commentId: replyState.parentCommentId,
          tempId: tempReplyId,
          user,
        })
      );
      toast.error(err.message || "Failed to add reply.");
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId, postId) => {
    setLoading(true);
    setError(null);

    // Calculate the `isLiked` status before dispatching the optimistic action
    const isLikedComment =
      cachedCommentData?.data[commentId]?.likes.includes(loggedInUserId);

    // Optimistically update the like count and the user's like status
    dispatch(
      optimisticLikeComment({
        postId,
        commentId,
        userId: loggedInUserId,
        isLikedComment, // Pass the `isLiked` status here
      })
    );

    try {
      const response = await fetch(
        `http://localhost:5000/posts/comments/${commentId}/like`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.message || "Failed to like the comment.");
      }

      const updatedComment = await response.json();

      // Confirm the update with the updated data
      dispatch(
        confirmLikeComment({
          postId,
          commentId,
          updatedComment,
        })
      );
    } catch (err) {
      console.error(err.message);

      // Revert the optimistic update on failure
      dispatch(
        failLikeComment({
          postId,
          commentId,
          userId: loggedInUserId,
          isLikedComment, // Pass the `isLiked` status here too
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLikeReply = async (replyId, commentId, postId) => {
    console.log("handleLikeReply called with arguments:");
    console.log("replyId:", replyId);
    console.log("commentId:", commentId);
    console.log("postId:", postId);

    setLoading(true);
    setError(null);

    // Calculate the `isLiked` status before dispatching the optimistic action
    const isLikedReply = repliesByCommentId?.[commentId]?.data
      .find((reply) => reply._id === replyId)
      ?.likes.includes(loggedInUserId);

    // Optimistically update the like count and the user's like status
    dispatch(
      optimisticLikeReply({
        postId,
        commentId,
        replyId,
        userId: loggedInUserId,
        isLikedReply, // Pass the `isLiked` status here
      })
    );

    try {
      const response = await fetch(
        `http://localhost:5000/posts/${postId}/comments/${commentId}/replies/${replyId}/like`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.message || "Failed to like the reply.");
      }

      const updatedReply = await response.json();

      // Confirm the update with the updated data
      dispatch(
        confirmLikeReply({
          postId,
          commentId,
          replyId,
          updatedReply,
        })
      );
    } catch (err) {
      console.error(err.message);

      // Revert the optimistic update on failure
      dispatch(
        failLikeReply({
          postId,
          commentId,
          replyId,
          userId: loggedInUserId,
          isLikedReply, // Pass the `isLiked` status here too
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      setLoading(true);

      // Optimistically update UI
      dispatch(optimisticDeleteComment({ postId, commentId }));

      // API call to delete comment
      const response = await fetch(
        `http://localhost:5000/posts/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete comment.");
      }

      // Confirm deletion
      dispatch(confirmDeleteComment({ postId, commentId }));
      toast.success("Comment deleted successfully!");
    } catch (error) {
      console.error("Error deleting comment:", error.message);
      dispatch(failDeleteComment({ postId, commentId }));
      toast.error(
        error.message || "Unable to delete comment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    try {
      setLoading(true);

      // Optimistically update UI
      dispatch(optimisticDeleteReply({ postId, commentId, replyId }));

      // API call to delete reply
      const response = await fetch(
        `http://localhost:5000/posts/${postId}/comments/${commentId}/replies/${replyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete reply.");
      }

      // Confirm deletion
      dispatch(confirmDeleteReply({ postId, commentId, replyId }));
      toast.success("Reply deleted successfully!");
    } catch (error) {
      console.error("Error deleting reply:", error.message);
      dispatch(failDeleteReply({ postId, commentId, replyId }));
      toast.error(error.message || "Unable to delete reply. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (
    postId,
    token,
    dispatch,
    page = 1,
    limit = 10
  ) => {
    try {
      // Set loading only when fetching
      setIsLoading(true);

      if (!postId || !token) {
        throw new Error("Invalid arguments: postId or token is missing.");
      }

      if (cachedCommentData?.pagination?.currentPage === page) return;

      // Ensure page and limit are numbers
      page = Number(page);
      limit = Number(limit);

      const url = `http://localhost:5000/posts/${postId}/comments?page=${page}&limit=${limit}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.message || "Error fetching comments.");
      }

      const fetchedComments = await response.json();

      if (fetchedComments.success) {
        dispatch(
          setComments({
            postId,
            comments: fetchedComments.data.comments,
            pagination: fetchedComments.data.pagination,
          })
        );
      }
    } catch (err) {
      console.error("[FETCH COMMENTS] Error:", err.message);
      toast.error(err.message || "An error occurred while fetching comments.");
    } finally {
      // Always set isLoading to false when the request finishes
      setIsLoading(false);
    }
  };

  const fetchReplies = async (
    postId,
    commentId,
    token,
    dispatch,
    page = 1,
    limit = 3
  ) => {
    try {
      if (!postId || !commentId || !token) {
        throw new Error(
          "Invalid arguments: postId, commentId, or token is missing."
        );
      }

      console.log(
        `Fetching replies for commentId: ${commentId} on postId: ${postId}`
      );

      // Fetch data directly if not already loaded
      const repliesData = state.replies[commentId];
      if (repliesData?.pagination?.currentPage === page) {
        console.log("[FETCH REPLIES] Skipping fetch, replies already cached.");
        return;
      }

      const url = `http://localhost:5000/posts/${postId}/comments/${commentId}/replies?page=${page}&limit=${limit}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.message || "Error fetching replies.");
      }

      const fetchedReplies = await response.json();
      if (fetchedReplies.success) {
        dispatch(
          setReplies({
            commentId,
            replies: fetchedReplies.data.replies,
            pagination: fetchedReplies.data.pagination,
          })
        );
      }
    } catch (err) {
      console.error("[FETCH REPLIES] Error:", err.message);
      toast.error(err.message || "An error occurred while fetching replies.");
    }
  };

  const fetchMoreComments = async (
    postId,
    token,
    dispatch,
    state,
    limit = 10
  ) => {
    const cachedData = state.comments[postId];
    const currentPage = cachedData?.pagination?.currentPage || 1;
    const totalPages = cachedData?.pagination?.totalPages || 0;

    if (currentPage >= totalPages) {
      return;
    }

    setScrollToTop(true);

    await fetchComments(postId, token, dispatch, currentPage + 1, limit);
  };

  const fetchMoreReplies = async (
    postId,
    commentId,
    token,
    dispatch,
    limit
  ) => {
    const pagination = repliesPagination(commentId); // Get current pagination
    const { currentPage, totalPages } = pagination;

    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;

      console.log(
        `[FETCH MORE REPLIES] Fetching replies for commentId: ${commentId}, currentPage: ${currentPage}, nextPage: ${nextPage}, totalPages: ${totalPages}.`
      );

      // Fetch replies for the next page
      await fetchReplies(postId, commentId, token, dispatch, nextPage, 3);

      console.log(
        `[FETCH MORE REPLIES] Fetched additional replies for commentId: ${commentId}, newCurrentPage: ${nextPage}.`
      );
    } else {
      console.log(
        `[FETCH MORE REPLIES] No more replies to fetch for commentId: ${commentId}.`
      );
    }
  };

  // Core toggle logic for managing expanded replies state
  const toggleReplies = async (
    postId,
    commentId,
    token,
    dispatch,
    limit = 3
  ) => {
    const pagination = repliesPagination(commentId); // Get pagination
    const isExpanded = expandedReplies[commentId];

    if (isExpanded) {
      setExpandedReplies((prev) => ({ ...prev, [commentId]: false }));
      return;
    }

    if (pagination.currentPage < pagination.totalPages) {
      await fetchMoreReplies(postId, commentId, token, dispatch, limit);
    }

    setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
  };

  // UI Component for rendering the reply button
  const ReplyButton = ({
    postId,
    commentId,
    expandedReplies,
    toggleReplies,
    fetchReplies,
    token,
    dispatch,
    repliesByCommentId,
  }) => {
    const isExpanded = expandedReplies[commentId];

    // Use the proper selector to get pagination
    const pagination = useSelector((state) =>
      selectRepliesPagination(state, commentId)
    );

    const replyCount = pagination?.totalReplies || 0;

    // Check if replies are already fetched (cached in state)
    const repliesAlreadyFetched =
      repliesByCommentId[commentId]?.data?.length > 0;

    const handleClick = () => {
      toggleReplies(postId, commentId, token, dispatch, 3); // Pass required params
      if (!isExpanded && !repliesAlreadyFetched) {
        // Only fetch if not expanded and replies are not cached
        fetchReplies(postId, commentId, token, dispatch, 1, 3); // Fetch first page
      }
    };

    const label = isExpanded
      ? "Hide Replies"
      : `View ${replyCount} Reply${replyCount !== 1 ? "ies" : ""}`;

    return (
      replyCount > 0 && (
        <Button
          onClick={handleClick}
          sx={{
            textTransform: "none",
            fontSize: "0.85rem",
            color: "primary.main",
            padding: 0,
            marginLeft: "8px",
          }}
        >
          {label}
        </Button>
      )
    );
  };

  const handleClickOutside = (event) => {
    if (
      replyInputRef.current &&
      !replyInputRef.current.contains(event.target)
    ) {
      setShowReplyInput(false);
    }
  };

  // const handleCancelReply = () => {
  //   setShowReplyInput(false); // Hide the reply input field
  //   setParentCommentId(null); // Reset parent comment
  //   setNewComment(""); // Clear the input field for comment
  //   setNewReply(""); // Clear the reply input
  //   setIsReplying(false); // Hide the reply input
  //   setActiveCommentId(null);
  // };

  // const handleClose = () => {
  //   setIsCommentsModalOpen(false);

  //   // Reset any active states
  //   setParentCommentId(null);
  //   setActiveCommentId(null);
  //   setIsReplying(false);
  //   setShowReplyInput(false);
  // };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (highlightedComment) {
      const element = document.getElementById(highlightedComment);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("highlighted");

        // Optionally, remove highlight after a short delay
        setTimeout(() => element.classList.remove("highlighted"), 2000);
      }
    }
  }, [highlightedComment]);

  useEffect(() => {
    if (isCommentsModalOpen && !isFetching) {
      const cachedComments = cachedCommentData?.data
        ? Object.values(cachedCommentData.data)
        : [];
      console.log("useEffect cachedComments:", cachedComments);
      const cachedReplies = cachedComments
        .map((comment) => comment.replies || [])
        .flat();
      console.log("useEffect cachedReplies:", cachedReplies);

      const totalCachedReplies = cachedComments.reduce(
        (sum, comment) => sum + (comment.replies?.length || 0),
        0
      );
      console.log("useEffect totalCachedReplies:", totalCachedReplies);

      const totalComments = cachedCommentData?.pagination?.totalComments;
      const currentPage = cachedCommentData?.pagination?.currentPage ?? 1;

      const commentsPerPage = 10;
      const expectedCommentsOnPage = Math.min(
        commentsPerPage,
        totalComments - (currentPage - 1) * commentsPerPage
      );

      const isCacheValid =
        cachedComments.length === expectedCommentsOnPage &&
        cachedReplies.length === totalCachedReplies;

      const lastFetched = cachedCommentData?.lastFetched ?? 0;
      const isFetchStale = Date.now() - lastFetched > 60000; // 1-minute threshold

      const shouldFetch = !isCacheValid || isFetchStale;

      if (shouldFetch) {
        console.log(`Fetching comments and replies for page ${currentPage}`);
        setIsFetching(true);

        // Fetch comments and replies in parallel (or sequentially)
        fetchComments(postId, token, dispatch, currentPage)
          .then(() => {
            // After fetching comments, fetch replies for each comment
            cachedComments.forEach((comment) => {
              if (!repliesByCommentId[comment._id]) {
                fetchReplies(postId, comment._id, token, dispatch, 1, 3);
              }
            });
          })
          .finally(() => {
            setIsFetching(false);
          });
      } else {
        console.log("Cache hit: Skipping fetch.");
      }
    }
  }, [
    isCommentsModalOpen,
    postId,
    token,
    dispatch,
    state,
    isFetching,
    cachedCommentData,
    repliesByCommentId,
  ]);

  useEffect(() => {
    if (scrollToTop) {
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      setScrollToTop(false); // Reset after scrolling
    }
  }, [scrollToTop]);

  // Return loading spinner if loading is true
  // if (isLoading) {
  //   return (
  //     <CircularProgress size={16} thickness={5} color="primary" />
  //     // <Box
  //     //   display="flex"
  //     //   justifyContent="center"
  //     //   alignItems="center"
  //     //   height="100vh"
  //     // >
  //     //   <CircularProgress />
  //     // </Box>
  //   );
  // }

  // Reply Button Component

  return (
    <animated.div style={postAnimationProps}>
      <WidgetWrapper margin="2rem 0">
        <Friend
          friendId={postUserId}
          name={`${firstName} ${lastName}`}
          subtitle={newLocation}
          userPicturePath={userPicturePath}
        />
        <Typography color={main} sx={{ mt: "1rem" }}>
          {newDescription}
        </Typography>

        {/* Display the formatted createdAt */}
        <Typography
          component="span"
          color="gray"
          sx={{
            textAlign: "center",
            marginTop: "0.75rem",
            fontSize: "0.875rem",
          }}
        >
          {moment(createdAt).fromNow()}
        </Typography>

        {picturePath && (
          <img
            width="100%"
            height="auto"
            alt="post"
            style={{ borderRadius: "0.75rem", marginTop: "0.75rem" }}
            src={`http://localhost:5000/assets/${picturePath}`}
          />
        )}
        <FlexBetween mt="0.25rem">
          <FlexBetween gap="1rem">
            <IconButton
              onClick={() => patchLike(postId)}
              disabled={loadingLike}
            >
              {loadingLike ? (
                <CircularProgress size={24} sx={{ color: primary }} />
              ) : isLiked ? (
                <FavoriteOutlined sx={{ color: primary }} />
              ) : (
                <FavoriteBorderOutlined />
              )}
            </IconButton>
            <Typography>{likeCount}</Typography>
            <IconButton onClick={() => openModal(postId, dispatch, comments)}>
              <ChatBubbleOutlineOutlined />
            </IconButton>
            <Typography>{commentCount}</Typography>
          </FlexBetween>
          <FlexBetween gap="0.3rem">
            <IconButton>
              <ShareOutlined />
            </IconButton>
            <IconButton onClick={() => setIsEditModalOpen(true)}>
              <EditOutlined />
            </IconButton>
          </FlexBetween>
          {/* Heart burst effect */}
          {showBubble && <div className="bubble"></div>}
        </FlexBetween>

        {/* Comments Modal */}
        <Modal
          open={isCommentsModalOpen}
          onClose={() => {
            setIsCommentsModalOpen(false);
            setExpandedReplies({});
          }}
        >
          <Box
            sx={{
              maxWidth: "500px",
              margin: "auto",
              p: 4,
              mt: "10%",
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 24,
              position: "relative",
            }}
          >
            <CloseIcon
              onClick={() => {
                setIsCommentsModalOpen(false);
                setExpandedReplies({});
              }}
              sx={{
                position: "absolute",
                top: "10px",
                right: "10px",
                cursor: "pointer",
                color: "gray",
              }}
            />
            <Typography variant="h6" color="primary">
              Comments
            </Typography>
            <Box sx={{ mt: 2, maxHeight: "300px", overflowY: "auto" }}>
              <div ref={topRef}></div>
              {comments === undefined ? (
                <Typography>Loading comments...</Typography>
              ) : comments.length === 0 ? (
                <Typography>
                  No comments yet. Be the first to comment!
                </Typography>
              ) : (
                comments.map((comment) => (
                  <Box
                    key={comment._id}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      mb: 2,
                      p: 2,
                      borderRadius: "8px",
                      boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {/* Comment Header */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* Left: User Picture */}
                      <UserImage
                        image={comment.userId?.picturePath}
                        size="40px"
                      />

                      {/* Middle: Name and Comment */}
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                          ml: 3,
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, fontSize: "0.9rem" }}
                        >
                          {comment.userId?.firstName} {comment.userId?.lastName}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", fontSize: "0.85rem" }}
                        >
                          {comment.text}
                        </Typography>
                      </Box>

                      {/* Right: Love Icon and Like Count */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          flexDirection: "column", // Add this to stack them vertically
                          justifyContent: "flex-start", // Align to the top of the box
                        }}
                      >
                        <IconButton
                          color="primary"
                          onClick={() =>
                            handleLikeComment(comment._id, comment.postId)
                          }
                          sx={{ p: 0.5 }}
                        >
                          <FavoriteBorderIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: 500,
                          }}
                        >
                          {comment.likeCount}
                        </Typography>

                        {/* Delete Icon (Basket) */}
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteComment(comment._id)}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Reply Button */}
                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Button
                        onClick={() => handleReplyInputToggle(comment._id)}
                        sx={{
                          textTransform: "none",
                          fontSize: "0.85rem",
                          color: "primary.main",
                          padding: 0,
                        }}
                      >
                        {replyState?.parentCommentId === comment._id &&
                        replyState?.isReplying
                          ? "Cancel"
                          : "Reply"}
                      </Button>
                      <ReplyButton
                        postId={postId}
                        commentId={comment._id}
                        replyCount={comment.replyCount}
                        expandedReplies={expandedReplies}
                        toggleReplies={toggleReplies}
                        fetchReplies={(postId, commentId) =>
                          fetchReplies(postId, commentId, token, dispatch, 1, 3)
                        }
                        token={token}
                        dispatch={dispatch}
                        repliesByCommentId={repliesByCommentId}
                      />
                    </Box>

                    {/* Replies */}
                    {expandedReplies[comment._id] &&
                      repliesByCommentId[comment._id]?.data.map(
                        (reply, index) => {
                          return (
                            <Box
                              key={reply._id}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                ml: 5,
                                mt: 1,
                                borderLeft: "2px solid #e0e0e0",
                                paddingLeft: 2,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  justifyContent: "space-between",
                                }}
                              >
                                {/* Reply User Picture */}
                                <UserImage
                                  image={reply.userId?.picturePath}
                                  size="30px"
                                />

                                {/* Reply Name and Text */}
                                <Box
                                  sx={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.3rem",
                                    ml: 3,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 500,
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    {reply.userId?.firstName}{" "}
                                    {reply.userId?.lastName}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: "text.secondary",
                                      fontSize: "0.8rem",
                                    }}
                                  >
                                    {reply.text}
                                  </Typography>
                                </Box>

                                {/* Reply Like Icon and Count */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <IconButton
                                    color="primary"
                                    onClick={() =>
                                      handleLikeReply(
                                        reply._id,
                                        comment._id,
                                        postId
                                      )
                                    }
                                    sx={{ p: 0.5 }}
                                  >
                                    {reply ? (
                                      reply.likes &&
                                      reply.likes.length > 0 &&
                                      reply.likes
                                        .map((id) => id.toString())
                                        .includes(reply.userId?._id) ? (
                                        <FavoriteIcon fontSize="small" />
                                      ) : (
                                        <FavoriteBorderIcon fontSize="small" />
                                      )
                                    ) : null}
                                  </IconButton>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {reply.likeCount}
                                  </Typography>
                                </Box>
                              </Box>
                              {index <
                                repliesByCommentId[comment._id]?.data.length -
                                  1 && (
                                <Divider
                                  sx={{ mx: "auto", width: "80%", mt: 1 }}
                                />
                              )}
                            </Box>
                          );
                        }
                      )}

                    {/* Reply Input */}
                    {replyState?.parentCommentId === comment._id &&
                      replyState?.isReplying && (
                        <Box sx={{ mt: 1 }}>
                          <TextField
                            fullWidth
                            placeholder="Write a reply..."
                            value={replyState.newReply}
                            onChange={(e) =>
                              setReplyState((prevState) => ({
                                ...prevState,
                                newReply: e.target.value,
                              }))
                            }
                          />
                          <Button
                            onClick={handleReplyComment}
                            variant="contained"
                            color="primary"
                            disabled={!replyState.newReply.trim()}
                            sx={{ mt: 1 }}
                          >
                            Submit Reply
                          </Button>
                        </Box>
                      )}
                  </Box>
                ))
              )}
            </Box>

            {/* Load More Comments */}
            {postId && commentsPagination && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Button
                  onClick={() =>
                    fetchMoreComments(postId, token, dispatch, state)
                  }
                  variant="text"
                  disabled={
                    isLoading ||
                    commentsPagination.currentPage >=
                      commentsPagination.totalPages
                  }
                >
                  {isLoading && (
                    <CircularProgress
                      size={16}
                      thickness={5}
                      sx={{ mr: 1, display: "inline-block" }}
                    />
                  )}
                  Load More Comments
                </Button>
                <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
                  <Typography variant="caption">
                    {fetchedComments} / {totalComments}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* New Comment Input */}
            <TextField
              fullWidth
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Add Comment
            </Button>
          </Box>
        </Modal>

        {/* Edit Modal */}
        <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
          <animated.div style={modalAnimationProps}>
            <Box
              sx={{
                maxWidth: "500px",
                margin: "auto",
                p: 4,
                mt: "10%",
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 24,
                overflowY: "auto",
                maxHeight: "70vh",
              }}
            >
              <Typography variant="h6" color={main}>
                Edit Post
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                label="Description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                sx={{ marginBottom: "1rem" }}
              />
              <TextField
                fullWidth
                variant="outlined"
                label="Location"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                sx={{ marginBottom: "1rem" }}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Save Changes"}
                </Button>
              </Box>
            </Box>
          </animated.div>
        </Modal>
      </WidgetWrapper>
    </animated.div>
  );
};

export default PostWidget;
