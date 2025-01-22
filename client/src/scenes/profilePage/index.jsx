import { Box, useMediaQuery, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "scenes/navbar";
import FriendListWidget from "scenes/widgets/FriendListWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import UserWidget from "scenes/widgets/UserWidget";

const ProfilePage = () => {
  const { userId } = useParams();
  const loggedInUserId = useSelector((state) => state.user._id);
  const loggedInPicturePath = useSelector((state) => state.user.picturePath);
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine if the profile belongs to the logged-in user
  const isOwnProfile = userId === loggedInUserId;

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://sociopedia-6tzx.onrender.com/users/${userId}/profile`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.message || "Failed to fetch profile data.");
      }

      const data = await response.json();

      // Log user, friends, and posts separately after destructuring
      const { user, friends, posts } = data;

      setProfileData(data);
    } catch (error) {
      console.error("Error fetching profile data:", error.message);
      setError(error.message);
      toast.error(error.message || "Could not load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId, token]);

  if (!userId) {
    return <Box> User ID is required!</Box>; // Early return if no userId is provided
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <p>{error}</p>
      </Box>
    );
  }

  if (!profileData) return null;

  const { user, friends, posts } = profileData;

  const propPicturePath = isOwnProfile
    ? loggedInPicturePath
    : profileData.user.picturePath;

  return (
    <Box>
      <Navbar />
      <Box
        width="100%"
        padding="2rem 6%"
        display={isNonMobileScreens ? "flex" : "block"}
        gap="2rem"
        justifyContent="center"
      >
        <Box flexBasis={isNonMobileScreens ? "26%" : undefined}>
          <UserWidget
            userId={userId}
            isOwnProfile={isOwnProfile}
            propPicturePath={propPicturePath}
          />
          <Box m="2rem 0" />
          <FriendListWidget friends={friends} isProfilePage={true} />
        </Box>
        <Box
          flexBasis={isNonMobileScreens ? "42%" : undefined}
          mt={isNonMobileScreens ? undefined : "2rem"}
        >
          <PostsWidget posts={posts} isProfilePage={true} />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;
