import { Box, Typography, CircularProgress, useTheme } from "@mui/material";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setFriends } from "state";

const FriendListWidget = ({ isProfilePage, friends: profileFriends }) => {
  const dispatch = useDispatch();
  const { palette } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userId = useSelector((state) => state.user?._id);
  const token = useSelector((state) => state.token);
  const friendsFromRedux = useSelector((state) => state.friends || []);
  const state = useSelector((state) => state);

  // Determine which friends list to display
  const displayFriends = isProfilePage ? profileFriends : friendsFromRedux;

  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://sociopedia-6tzx.onrender.com/users/${userId}/friends`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch friends.");
      }

      const data = await response.json();
      dispatch(setFriends({ friends: data }));
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch friends if not on the profile page
  useEffect(() => {
    if (!isProfilePage) {
      fetchFriends();
    }
  }, [isProfilePage, userId, token, dispatch]);

  // console.log("Display Friends:", displayFriends); // Log the friends to display

  return (
    <WidgetWrapper>
      <Typography
        color={palette.neutral.dark}
        variant="h5"
        fontWeight="500"
        sx={{ mb: "1.5rem" }}
      >
        Friend List
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography variant="h6" color={palette.error.main} textAlign="center">
          {error}
        </Typography>
      ) : displayFriends.length === 0 ? (
        <Typography
          variant="h6"
          color={palette.neutral.dark}
          textAlign="center"
        >
          No friends found.
        </Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap="1rem">
          {displayFriends.map((friend) => (
            <Friend
              key={friend._id}
              friendId={friend._id}
              name={`${friend.firstName || "Unknown"} ${friend.lastName || ""}`}
              subtitle={friend.occupation || "No occupation provided"}
              userPicturePath={friend.picturePath || "/default-avatar.png"}
            />
          ))}
        </Box>
      )}
    </WidgetWrapper>
  );
};

export default FriendListWidget;
