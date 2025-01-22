import { PersonAddOutlined, PersonRemoveOutlined } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setFriends } from "state";
import FlexBetween from "./FlexBetween";
import FriendImages from "./FriendsImages";
import { toast } from "react-toastify";
import { useState } from "react";

const Friend = ({ friendId, name, subtitle, userPicturePath }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { _id: userId } = useSelector((state) => state.user || {});
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.friends || []);

  const [loading, setLoading] = useState(false);

  const { palette } = useTheme();
  const primaryLight = palette.primary.light;
  const primaryDark = palette.primary.dark;
  const main = palette.neutral.main;

  // Truncate long names
  const truncatedName = name.length > 20 ? `${name.slice(0, 20)}...` : name;

  const isFriend = friends.some((friend) => friend._id === friendId);

  const patchFriend = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://sociopedia-6tzx.onrender.com/users/${userId}/${friendId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update friendship.");
      }

      const updatedFriends = await response.json(); // This should contain full friend objects

      // Dispatch the full updated friend list
      dispatch(setFriends({ friends: updatedFriends }));

      toast.success(
        isFriend ? "Friend removed successfully." : "Friend added successfully."
      );
    } catch (err) {
      toast.error(
        err.message || "An error occurred while updating friendship."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlexBetween>
      <FlexBetween gap="1rem">
        <FriendImages friendId={friendId} picturePath={userPicturePath} />
        <Box
          onClick={() => {
            navigate(`/profile/${friendId}`);
          }}
          sx={{ marginLeft: "0.3rem", marginRight: "0.3rem" }}
        >
          <Typography
            color={main}
            variant="h5"
            fontWeight="500"
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "180px",
              "&:hover": {
                color: primaryLight,
                cursor: "pointer",
              },
            }}
          >
            {truncatedName}
          </Typography>
          <Typography color={palette.neutral.medium} fontSize="0.75rem">
            {subtitle}
          </Typography>
        </Box>
      </FlexBetween>
      <IconButton
        onClick={patchFriend}
        sx={{
          backgroundColor: primaryLight,
          p: "0.6rem",
          marginLeft: "0.5rem",
        }}
        disabled={loading}
      >
        {loading ? (
          <CircularProgress size={24} sx={{ color: primaryDark }} />
        ) : isFriend ? (
          <PersonRemoveOutlined sx={{ color: primaryDark }} />
        ) : (
          <PersonAddOutlined sx={{ color: primaryDark }} />
        )}
      </IconButton>
    </FlexBetween>
  );
};

export default Friend;
