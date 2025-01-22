import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts, resetPosts } from "state";
import PostWidget from "./PostWidget";
import { CircularProgress, Box, Typography } from "@mui/material";
import { toast } from "react-toastify";

const PostsWidget = ({ isProfilePage = false, posts: profilePosts = [] }) => {
  const dispatch = useDispatch();
  const allPosts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch general posts
  const getPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        "https://sociopedia-6tzx.onrender.com/posts",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.message || "Failed to fetch posts feed.");
      }

      const data = await response.json();

      // Extract only the posts array
      const posts = data.posts;

      dispatch(setPosts({ posts })); // Dispatch the posts array only
    } catch (error) {
      console.error("Error fetching posts:", error.message);
      setError(error.message || "Could not load posts feed.");
      toast.error(error.message || "Could not load posts feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isProfilePage && Object.keys(allPosts).length === 0 && !loading) {
      // Only fetch if no posts are available and not loading
      dispatch(resetPosts()); // Ensure this doesn't trigger repeatedly
      getPosts(); // Ensure this only runs when needed
    }
  }, [isProfilePage, loading, dispatch, token]);

  // Determine which posts to display
  const displayPosts = isProfilePage ? profilePosts : Object.values(allPosts);

  // Sort posts by createdAt in descending order (newest first)
  const sortedPosts = [...displayPosts].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <>
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100vh"
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          height="100vh"
          textAlign="center"
        >
          <Typography variant="h6" color="error" mb={2}>
            {error}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Please try again later or contact support if the issue persists.
          </Typography>
        </Box>
      ) : (
        sortedPosts.map((post) => {
          return <PostWidget key={post._id} post={post} />;
        })
      )}
    </>
  );
};

export default PostsWidget;
