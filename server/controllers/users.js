import Post from "../models/Post.js";
import User from "../models/User.js";

/* Get user */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    console.log(req.user.id);
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* Get user friends */
export const getUserFriends = async (req, res) => {
  console.log("Received request to fetch friends for user:", req.params.id); // Log the request
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );
    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* Get user profile */
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch user details
    const user = await User.findById(id).select("-password"); // Exclude sensitive data

    // Fetch and format friends
    const friends = await Promise.all(
      user.friends.map((friendId) => User.findById(friendId))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, picturePath, occupation, location }) => ({
        _id,
        firstName,
        lastName,
        picturePath,
        occupation,
        location,
      })
    );

    // Fetch posts
    const posts = await Post.find({ userId: id }).sort({ createdAt: -1 });

    res.status(200).json({ user, friends: formattedFriends, posts });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* Add or remove a friend */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    console.log("User ID:", id, "Friend ID:", friendId);

    if (id === friendId) {
      return res
        .status(400)
        .json({ message: "You cannot add yourself as a friend." });
    }

    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res
        .status(404)
        .json({ message: user ? "Friend not found." : "User not found." });
    }

    const isFriend = user.friends.includes(friendId);

    if (isFriend) {
      user.friends = user.friends.filter((fid) => fid !== friendId);
      friend.friends = friend.friends.filter((fid) => fid !== id);
    } else {
      user.friends.push(friendId);
      friend.friends.push(id);
    }

    await user.save();
    await friend.save();

    const friends = await Promise.all(
      user.friends.map((fid) => User.findById(fid))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => ({
        _id,
        firstName,
        lastName,
        occupation,
        location,
        picturePath,
      })
    );

    res.status(200).json(formattedFriends);
  } catch (err) {
    console.error("Error in addRemoveFriend:", err.message);
    res.status(500).json({ message: "An error occurred." });
  }
};
