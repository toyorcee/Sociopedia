import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "light",
  user: null,
  token: null,
  likes: {},
  posts: {},
  images: {},
  friends: [],
  categories: [],
  techxtrosavings: [],
  propertyRentals: [],
  adverts: {},
  comments: {},
  replies: {},
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalComments: 0,
  },
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
    },
    setFriends: (state, action) => {
      state.friends = action.payload.friends;
    },
    setPosts: (state, action) => {
      state.posts = action.payload.posts.reduce((acc, post) => {
        acc[post._id] = post;
        return acc;
      }, {});
    },
    setPost: (state, action) => {
      const post = action.payload.post;
      state.posts[post._id] = post;
    },
    resetPosts: (state) => {
      state.posts = {};
    },
    saveImage: (state, action) => {
      const { key, imageUrl } = action.payload;
      console.log("Save image action payload:", action.payload); // Log to see what we're dispatching
      state.images[key] = imageUrl;
      console.log("Updated Redux images state:", state.images); // Debug log
    },
    setCategories: (state, action) => {
      console.log("Payload for categories in reducer:", action.payload); // Log payload
      state.categories = action.payload; // Ensure the payload structure matches
    },
    setTechxtrosavings: (state, action) => {
      console.log("Payload for Techxtrosavings:", action.payload);
      state.techxtrosavings = action.payload;
    },
    setPropertyRentals: (state, action) => {
      console.log("Payload for Property Rentals:", action.payload);
      state.propertyRentals = action.payload;
    },
    setAdverts: (state, action) => {
      state.adverts = action.payload.adverts.reduce((acc, advert) => {
        acc[advert._id] = advert;
        return acc;
      }, {});
    },
    setAdvert: (state, action) => {
      const advert = action.payload.advert;
      state.adverts[advert._id] = advert;
    },
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setComments: (state, action) => {
      console.log("Payload for setComments:", action.payload);

      const { postId, comments, pagination } = action.payload;

      const normalizedComments = comments.reduce((acc, comment) => {
        if (comment._id) {
          acc[comment._id] = {
            ...comment,
            replyCount: comment.replyCount || 0,
          };
        } else {
          console.warn("Skipping comment due to missing _id:", comment);
        }
        return acc;
      }, {});

      // Existing comments and order
      const currentComments = state.comments[postId]?.data || {};
      const currentCommentOrder = state.comments[postId]?.commentOrder || [];

      // Merge new comments at the top
      const newCommentOrder = [
        ...comments.map((comment) => comment._id), // Add new comments first
        ...currentCommentOrder, // Keep existing order
      ].filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

      // Update the state
      state.comments[postId] = {
        data: {
          ...currentComments,
          ...normalizedComments,
        },
        commentOrder: newCommentOrder,
        pagination: {
          currentPage:
            pagination?.currentPage ??
            (state.comments[postId]?.pagination?.currentPage ?? 1) + 1,
          totalPages:
            pagination?.totalPages ??
            state.comments[postId]?.pagination?.totalPages ??
            0,
          totalComments:
            pagination?.totalComments ??
            state.comments[postId]?.pagination?.totalComments ??
            0,
        },
        lastFetched: Date.now(),
      };

      console.log("Updated State.comments:", state.comments);
    },
    setReplies: (state, action) => {
      console.log("Payload for setReplies:", action.payload);

      const { commentId, replies, pagination } = action.payload;
      const normalizedReplies = replies.reduce((acc, reply) => {
        acc[reply._id] = {
          ...reply,
          likes: reply.likes || [],
        };
        return acc;
      }, {});

      if (!state.replies[commentId]) {
        state.replies[commentId] = {
          data: {},
          replyOrder: [],
          pagination: {},
          lastFetched: 0,
        };
      }

      state.replies[commentId] = {
        data: {
          ...state.replies[commentId].data,
          ...normalizedReplies,
        },
        replyOrder: Array.from(
          new Set([
            ...state.replies[commentId].replyOrder,
            ...replies.map((reply) => reply._id),
          ])
        ),
        pagination: pagination || state.replies[commentId].pagination,
        lastFetched: Date.now(),
      };

      console.log("Updated State.replies:", state.replies);
    },
    optimisticLikePost: (state, action) => {
      const { postId, userId, isLiked } = action.payload;
      const post = state[postId];

      if (post) {
        if (isLiked) {
          // Optimistically remove the like
          post.likes = post.likes.filter((id) => id !== userId);
          post.likeCount = Math.max(post.likeCount - 1, 0);
        } else {
          // Optimistically add the like
          post.likes.push(userId);
          post.likeCount += 1;
        }
      }
    },
    confirmLikePost: (state, action) => {
      const { postId, updatedPost } = action.payload;
      const post = state[postId];

      if (post && updatedPost) {
        // Sync the post with the backend's updated data
        state[postId] = {
          ...post,
          likes: updatedPost.likes,
          likeCount: updatedPost.likeCount,
        };
      }
    },
    failLikePost: (state, action) => {
      const { postId, userId, isLiked } = action.payload;
      const post = state[postId];

      if (post) {
        if (isLiked) {
          // Revert to liked state
          if (!post.likes.includes(userId)) {
            post.likes.push(userId);
            post.likeCount += 1;
          }
        } else {
          // Revert to unliked state
          post.likes = post.likes.filter((id) => id !== userId);
          post.likeCount = Math.max(post.likeCount - 1, 0);
        }
      }
    },
    optimisticLikeComment: (state, action) => {
      const { postId, commentId, userId, isLikedComment } = action.payload;
      const comment = state.comments?.[postId]?.data[commentId];

      if (comment) {
        // Toggle like status optimistically based on the `isLiked` status
        if (isLikedComment) {
          // Remove the like (optimistic unlike)
          comment.likes = comment.likes.filter((id) => id !== userId);
          comment.likeCount = Math.max(comment.likeCount - 1, 0); // Ensure likeCount doesn't go below 0
        } else {
          // Add the like (optimistic like)
          comment.likes.push(userId);
          comment.likeCount += 1;
        }
      }
    },
    confirmLikeComment: (state, action) => {
      const { postId, commentId, updatedComment } = action.payload;

      const comment = state.comments?.[postId]?.data[commentId];
      if (comment && updatedComment) {
        // Sync the comment with the backend's updated data
        state.comments[postId].data[commentId] = {
          ...comment,
          likes: updatedComment.likes,
          likeCount: updatedComment.likeCount,
        };
      }
    },
    failLikeComment: (state, action) => {
      const { postId, commentId, userId, isLikedComment } = action.payload;
      const comment = state.comments?.[postId]?.data[commentId];

      if (comment) {
        // Revert the like status based on `isLiked`
        if (isLikedComment) {
          // Remove like (reverting unlike failure)
          comment.likes = comment.likes.filter((id) => id !== userId);
          comment.likeCount = Math.max(comment.likeCount - 1, 0);
        } else {
          // Add like (reverting like failure)
          comment.likes.push(userId);
          comment.likeCount += 1;
        }
      }
    },
    optimisticLikeReply: (state, action) => {
      const { commentId, replyId, userId, isLikedReply } = action.payload;

      // Find the specific reply in `repliesByCommentId`
      const reply = state.repliesByCommentId?.[commentId]?.data.find(
        (reply) => reply._id === replyId
      );

      if (reply) {
        console.log("Optimistic UI update for like status:");
        console.log("Reply before update:", reply);

        // Toggle like status optimistically
        if (isLikedReply) {
          // Remove the like (optimistic unlike)
          reply.likes = reply.likes.filter((id) => id !== userId);
          reply.likeCount = Math.max(reply.likeCount - 1, 0); // Ensure likeCount doesn't go below 0
        } else {
          // Add the like (optimistic like)
          reply.likes.push(userId);
          reply.likeCount += 1;
        }
        console.log("Reply after update:", reply);
      }
    },
    confirmLikeReply: (state, action) => {
      const { commentId, replyId, updatedReply } = action.payload;

      // Find the specific reply in `repliesByCommentId`
      const reply = state.repliesByCommentId?.[commentId]?.data.find(
        (reply) => reply._id === replyId
      );

      if (reply && updatedReply) {
        // Sync with the backend's updated data
        reply.likes = updatedReply.likes;
        reply.likeCount = updatedReply.likeCount;
      }
    },
    failLikeReply: (state, action) => {
      const { commentId, replyId, userId, isLikedReply } = action.payload;

      // Find the specific reply in `repliesByCommentId`
      const reply = state.repliesByCommentId?.[commentId]?.data.find(
        (reply) => reply._id === replyId
      );

      if (reply) {
        // Revert like status based on failure
        if (isLikedReply) {
          // User had liked before: Re-add user to likes (restore original "liked" state)
          if (!reply.likes.includes(userId)) {
            reply.likes.push(userId);
            reply.likeCount += 1;
          }
        } else {
          // User had not liked before: Remove user from likes (restore original "unliked" state)
          reply.likes = reply.likes.filter((id) => id !== userId);
          reply.likeCount = Math.max(reply.likeCount - 1, 0);
        }
      }
    },
    optimisticAddComment: (state, action) => {
      const { postId, comment } = action.payload;

      if (!state.comments[postId]) {
        state.comments[postId] = {
          data: {},
          commentOrder: [],
          pagination: { currentPage: 1, totalPages: 0, totalComments: 0 },
        };
      }

      // Add the new comment to the data object
      state.comments[postId].data[comment.id] = {
        ...comment,
        replies: comment.replies || [], // Default to an empty replies array
      };

      // Add the comment ID to the order array
      state.comments[postId].commentOrder.unshift(comment.id); // Prepend the ID for immediate visibility

      // Increment totalComments here for the immediate effect
      state.comments[postId].pagination.totalComments += 1;
    },
    confirmAddComment: (state, action) => {
      const { postId, tempId, confirmedComment } = action.payload;

      if (state.comments[postId]) {
        // Remove the temporary ID from the data object
        delete state.comments[postId].data[tempId];

        // Add the confirmed comment
        state.comments[postId].data[confirmedComment._id] = {
          ...confirmedComment,
          replies: confirmedComment.replies || [],
        };

        // Replace the temporary ID with the confirmed one in the commentorder array
        const orderIndex = state.comments[postId].commentOrder.indexOf(tempId);
        if (orderIndex !== -1) {
          state.comments[postId].commentOrder[orderIndex] =
            confirmedComment._id;
        }

        // Increment the commentCount for the post here
        if (state.posts[postId]) {
          const oldCount = state.posts[postId].commentCount || 0;
          state.posts[postId].commentCount = oldCount + 1;
        }
      }
    },
    failAddComment: (state, action) => {
      const { postId, tempId } = action.payload;

      if (state.comments[postId]) {
        // Remove the failed optimistic comment
        delete state.comments[postId].data[tempId];

        // Remove the temp ID from the order array
        state.comments[postId].commentOrder = state.comments[
          postId
        ].commentOrder.filter((id) => id !== tempId);

        // Decrement totalComments, ensuring it doesn't go below 0
        state.comments[postId].pagination.totalComments = Math.max(
          (state.comments[postId].pagination.totalComments || 1) - 1,
          0
        );
      }

      if (state.posts[postId]) {
        // Decrement commentCount for the post, ensuring it doesn't go below 0
        state.posts[postId].commentCount = Math.max(
          (state.posts[postId].commentCount || 1) - 1,
          0
        );
      }

      // Log for debugging
      console.log(
        `Fail AddComment - Updated counts for post ${postId}: TotalComments = ${
          state.comments[postId]?.pagination.totalComments || 0
        }, CommentCount = ${state.posts[postId]?.commentCount || 0}`
      );
    },
    optimisticAddReply: (state, action) => {
      const { commentId, reply } = action.payload;

      console.log("[optimisticAddReply] Adding Optimistic Reply:", reply);

      // Ensure replies object exists for the parent comment
      if (!state.replies[commentId]) {
        state.replies[commentId] = {
          data: {}, // Object to hold replies by ID
          replyOrder: [], // Array to maintain reply order
          pagination: { currentPage: 1, totalPages: 0, totalReplies: 0 }, // Initialize totalReplies
        };
      }

      // Add the new reply to the data object
      state.replies[commentId].data[reply._id] = reply;

      // Add the temporary reply ID to the replyOrder array
      state.replies[commentId].replyOrder.push(reply._id);

      // Sort the replyOrder array based on createdAt
      state.replies[commentId].replyOrder.sort((a, b) => {
        const replyA = state.replies[commentId].data[a];
        const replyB = state.replies[commentId].data[b];
        return new Date(replyA.createdAt) - new Date(replyB.createdAt);
      });

      // Increment the totalReplies for immediate effect
      state.replies[commentId].pagination.totalReplies += 1;

      console.log(
        `Optimistic AddReply - Updated totalReplies for comment ${commentId}:`,
        state.replies[commentId].pagination.totalReplies
      );
    },
    confirmAddReply: (state, action) => {
      const { commentId, tempId, confirmedReply } = action.payload;

      console.log("[confirmAddReply] Action Payload:", action.payload);

      // Ensure replies object exists for the parent comment
      if (!state.replies[commentId]) return;

      // Remove the temporary reply
      delete state.replies[commentId].data[tempId];

      // Add the confirmed reply to the data object
      state.replies[commentId].data[confirmedReply._id] = confirmedReply;

      // Replace `tempId` with the confirmed reply's ID in `replyOrder`
      state.replies[commentId].replyOrder = state.replies[
        commentId
      ].replyOrder.map((id) => (id === tempId ? confirmedReply._id : id));

      // Sort the replyOrder array based on createdAt
      state.replies[commentId].replyOrder.sort((a, b) => {
        const replyA = state.replies[commentId].data[a];
        const replyB = state.replies[commentId].data[b];
        return new Date(replyA.createdAt) - new Date(replyB.createdAt);
      });

      console.log(
        "[confirmAddReply] Updated Replies:",
        JSON.stringify(state.replies[commentId], null, 2)
      );
    },
    failAddReply: (state, action) => {
      const { commentId, tempId } = action.payload;

      if (state.replies[commentId]) {
        // Remove the failed optimistic reply
        delete state.replies[commentId].data[tempId];

        // Remove the temp ID from the replyOrder array
        state.replies[commentId].replyOrder = state.replies[
          commentId
        ].replyOrder.filter((id) => id !== tempId);

        // Ensure no `undefined` entries remain in replyOrder
        state.replies[commentId].replyOrder =
          state.replies[commentId].replyOrder.filter(Boolean);

        // Decrement the totalReplies for the replies object
        state.replies[commentId].pagination.totalReplies = Math.max(
          (state.replies[commentId].pagination.totalReplies || 1) - 1,
          0
        );
      }

      // Log for debugging
      console.log(
        `Fail AddReply - Updated totalReplies for comment ${commentId}:`,
        state.replies[commentId]?.pagination?.totalReplies || 0
      );
    },
    optimisticDeleteComment: (state, action) => {
      const { postId, commentId } = action.payload;

      // Initialize comments as an array if not present
      if (!state.comments[postId]) {
        state.comments[postId] = [];
      }

      const postComments = state.comments[postId] || [];

      // Create a new array with the comment marked as pending (optimistic deletion)
      const updatedComments = postComments.map((comment) =>
        comment._id === commentId ? { ...comment, pending: true } : comment
      );

      return {
        ...state,
        comments: {
          ...state.comments,
          [postId]: updatedComments,
        },
      };
    },
    confirmDeleteComment: (state, action) => {
      const { postId, commentId } = action.payload;

      const postComments = state.comments[postId] || [];

      // Remove the comment that was successfully deleted
      const updatedComments = postComments.filter(
        (comment) => comment._id !== commentId
      );

      return {
        ...state,
        comments: {
          ...state.comments,
          [postId]: updatedComments,
        },
      };
    },
    failDeleteComment: (state, action) => {
      const { postId, commentId } = action.payload;

      const postComments = state.comments[postId] || [];

      // Restore the comment if the delete operation failed
      const updatedComments = postComments.map((comment) =>
        comment._id === commentId ? { ...comment, pending: false } : comment
      );

      return {
        ...state,
        comments: {
          ...state.comments,
          [postId]: updatedComments,
        },
      };
    },
    optimisticDeleteReply: (state, action) => {
      const { postId, commentId, replyId } = action.payload;

      const commentReplies = state.replies[commentId] || [];
      const updatedReplies = commentReplies.map((reply) =>
        reply._id === replyId ? { ...reply, pending: true } : reply
      );

      return {
        ...state,
        replies: {
          ...state.replies,
          [commentId]: updatedReplies,
        },
      };
    },
    confirmDeleteReply: (state, action) => {
      const { commentId, replyId } = action.payload;

      const commentReplies = state.replies[commentId] || [];
      const updatedReplies = commentReplies.filter(
        (reply) => reply._id !== replyId
      );

      return {
        ...state,
        replies: {
          ...state.replies,
          [commentId]: updatedReplies,
        },
      };
    },
    failDeleteReply: (state, action) => {
      const { commentId, replyId } = action.payload;

      const commentReplies = state.replies[commentId] || [];
      const updatedReplies = commentReplies.map((reply) =>
        reply._id === replyId ? { ...reply, pending: false } : reply
      );

      return {
        ...state,
        replies: {
          ...state.replies,
          [commentId]: updatedReplies,
        },
      };
    },
    clearCommentsCache: (state, action) => {
      const { postId } = action.payload;
      if (state.comments[postId]) {
        delete state.comments[postId]; // Remove cached comments for this post
      }
    },
  },
});

export const {
  setMode,
  setLogin,
  setLogout,
  setFriends,
  setPosts,
  setPost,
  resetPosts,
  saveImage,
  setCategories,
  setTechxtrosavings,
  setPropertyRentals,
  setAdverts,
  setAdvert,
  setUser,
  setComments,
  setReplies,
  optimisticLikePost,
  confirmLikePost,
  failLikePost,
  setPostData,
  optimisticLikeComment,
  confirmLikeComment,
  failLikeComment,
  optimisticLikeReply,
  confirmLikeReply,
  failLikeReply,
  optimisticAddComment,
  confirmAddComment,
  failAddComment,
  optimisticAddReply,
  confirmAddReply,
  failAddReply,
  optimisticDeleteComment,
  confirmDeleteComment,
  failDeleteComment,
  optimisticDeleteReply,
  confirmDeleteReply,
  failDeleteReply,
  clearCommentsCache,
} = authSlice.actions;

export default authSlice.reducer;
