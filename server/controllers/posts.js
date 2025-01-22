import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

// CREATE POST
export const createPost = async (req, res) => {
  try {
    // Log the entire request body and file
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);

    const { userId, description, picturePath } = req.body;

    // Validation checks
    if (!userId || !description) {
      console.log("Validation failed: Missing userId or description.");
      return res
        .status(400)
        .json({ message: "User ID and description are required." });
    }

    // Find the user to get details for the post
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found for ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Create the new post
    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      picturePath,
      likes: [],
      likeCount: 0,
      commentCount: 0,
    });

    console.log("Post Before Save:", newPost);

    // Save the post
    await newPost.save();

    // Log the created post before responding
    console.log("New Post Created:", newPost);

    // Respond with the newly created post
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error during post creation:", err.message);
    res.status(409).json({ error: err.message });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Fetch paginated posts
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // Latest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select(
        "userId firstName lastName location description picturePath userPicturePath likes likeCount commentCount createdAt"
      );

    const totalPosts = await Post.countDocuments();

    const pagination = {
      totalPosts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPosts / limit),
    };

    res.status(200).json({ posts, pagination });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET USERS FEED */
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select(
        "firstName lastName location description picturePath userPicturePath likes likeCount commentCount createdAt"
      );

    const totalPosts = await Post.countDocuments({ userId });

    const pagination = {
      totalPosts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPosts / limit),
    };

    res.status(200).json({ posts, pagination });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isLiked = post.likes.includes(userId);
    const update = isLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updatedPost = await Post.findByIdAndUpdate(postId, update, {
      new: true,
    });
    res
      .status(200)
      .json({ post: updatedPost, message: isLiked ? "Unliked" : "Liked" });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

// EDIT POST
export const editPost = async (req, res) => {
  const { id } = req.params;
  const { description, location } = req.body;
  const userId = req.user.id; // Assuming user id is provided via auth middleware

  try {
    // Find the post by ID
    const post = await Post.findById(id);

    // Check if the post exists
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Ensure the logged-in user is the post owner
    if (post.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can only edit your own posts" });
    }

    // Update post fields (only if provided in the request)
    post.description = description || post.description;
    post.location = location || post.location;

    // Save the updated post
    await post.save();

    // Respond with the updated post
    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE POST //
export const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Assuming user is authenticated

  try {
    // Find the post by ID
    const post = await Post.findById(id);

    // Check if the post exists
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the logged-in user is the owner of the post
    if (post.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts" });
    }

    // Delete the post
    await post.remove();
    res.status(200).json({
      success: true,
      data: null,
      message: "Post deleted successfully",
      errors: [],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: "An error occurred while deleting the post.",
      errors: [err.message],
    });
  }
};
