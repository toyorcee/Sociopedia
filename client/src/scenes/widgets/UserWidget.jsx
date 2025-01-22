import {
  ManageAccountsOutlined,
  EditOutlined,
  LocationOnOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Divider,
  useTheme,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { LinkedIn, Facebook, Instagram, Twitter } from "@mui/icons-material";
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const UserWidget = ({ userId, isOwnProfile, propPicturePath }) => {
  const { _id } = useSelector((state) => state.user);
  const loggedInUserId = _id;
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { palette } = useTheme();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const dark = palette.neutral.dark;
  const medium = palette.neutral.medium;
  const main = palette.neutral.main;

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);

    try {
      // If it's the logged-in user, we use their userId, otherwise we use the provided userId from params
      const idToFetch = isOwnProfile ? loggedInUserId : userId;

      const response = await fetch(
        `http://localhost:5000/users/${idToFetch}/profile`,
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

      setProfileData(data);
      setUser(data);
    } catch (error) {
      console.error("Error fetching profile data:", error.message);
      setError(error.message);
      toast.error(error.message || "Could not load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId, isOwnProfile, loggedInUserId, token]); // Add dependencies

  const handleEditSocialProfile = (platform) => {
    // Placeholder function to handle social link edits
    console.log(`Editing ${platform} profile`);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress size={50} color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <WidgetWrapper>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </WidgetWrapper>
    );
  }

  if (!user) return null;

  const {
    firstName,
    lastName,
    location,
    occupation,
    viewedProfile,
    impressions,
    friends,
  } = profileData?.user || {};

  return (
    <WidgetWrapper>
      <FlexBetween
        gap="0.5rem"
        pb="1.1rem"
        onClick={() => navigate(`/profile/${_id}`)}
      >
        <FlexBetween gap="1rem">
          <UserImage propPicturePath={propPicturePath} size="40px" />
          <Box>
            <Typography
              variant="h4"
              color={dark}
              fontWeight="500"
              sx={{
                "&:hover": {
                  color: palette.primary.light,
                  cursor: "pointer",
                },
              }}
            >
              {firstName} {lastName}
            </Typography>
            <Typography color={medium}>{friends.length} friends</Typography>
          </Box>
        </FlexBetween>
        <ManageAccountsOutlined />
      </FlexBetween>

      <Divider />

      <Box p="1rem 0">
        <Box display="flex" alignItems="center" gap="1rem" mb="0.5rem">
          <LocationOnOutlined fontSize="large" sx={{ color: main }} />
          <Typography color={medium}>{location}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap="1rem">
          <WorkOutlineOutlined fontSize="large" sx={{ color: main }} />
          <Typography color={medium}>{occupation}</Typography>
        </Box>
      </Box>

      <Divider />

      <Box p="1rem 0">
        <FlexBetween mb="0.5rem">
          <Typography color={medium}>Who's viewed your profile</Typography>
          <Typography color={main} fontWeight="500">
            {viewedProfile}
          </Typography>
        </FlexBetween>
        <FlexBetween>
          <Typography color={medium}>Impressions of your post</Typography>
          <Typography color={main} fontWeight="500">
            {impressions}
          </Typography>
        </FlexBetween>
      </Box>

      <Divider />

      <Box p="1rem 0">
        <Typography fontSize="1rem" color={main} fontWeight="500" mb="1rem">
          Social Profiles
        </Typography>

        {[
          { icon: <Twitter sx={{ color: main }} />, label: "X", platform: "X" },
          {
            icon: <LinkedIn sx={{ color: main }} />,
            label: "LinkedIn",
            platform: "LinkedIn",
          },
          {
            icon: <Facebook sx={{ color: main }} />,
            label: "Facebook",
            platform: "Facebook",
          },
          {
            icon: <Instagram sx={{ color: main }} />,
            label: "Instagram",
            platform: "Instagram",
          },
        ].map((social) => (
          <FlexBetween key={social.platform} gap="1rem" mb="0.5rem">
            <FlexBetween gap="1rem">
              <IconButton>{social.icon}</IconButton>
              <Box>
                <Typography color={main} fontWeight="500">
                  {social.label}
                </Typography>
                <Typography color={medium}>Social Network</Typography>
              </Box>
            </FlexBetween>
            <IconButton
              onClick={() => handleEditSocialProfile(social.platform)}
            >
              <EditOutlined sx={{ color: main }} />
            </IconButton>
          </FlexBetween>
        ))}
      </Box>
    </WidgetWrapper>
  );
};

export default UserWidget;
