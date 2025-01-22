import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveImage } from "../state/index.js";
import { openDB } from "idb";

const defaultAvatar =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
const EXPIRATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours cache expiration

// Utility function to read file as base64
const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Caching image fetch logic
const fetchImageWithCache = async (key, imageURL, token, dispatch) => {
  console.log("Attempting to fetch image for key:", key, "from URL:", imageURL);

  const db = await openDB("UserImageDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images");
      }
    },
  });

  const cachedData = await db.get("images", key);
  console.log("Cached data retrieved:", cachedData); // Log to check cache status

  if (cachedData && Date.now() - cachedData.timestamp < EXPIRATION_DURATION) {
    console.log("Using cached image:", key); // Debug log
    const cachedBase64 = cachedData.base64;

    // Save the cached base64 image to Redux
    console.log("Dispatching cached base64 image to Redux:", {
      key,
      imageUrl: cachedBase64,
    });
    dispatch(saveImage({ key, imageUrl: cachedBase64 }));

    return cachedBase64; // Return cached base64 image
  }

  // Fetch the image from the server if not cached
  const response = await fetch(imageURL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch image");

  const blob = await response.blob();
  const reader = new FileReader();

  reader.onloadend = () => {
    const base64 = reader.result;
    console.log("Fetched image from server and converted to base64:", base64);

    // Save the fetched image to IndexedDB
    db.put("images", { base64, timestamp: Date.now() }, key);

    // Save to Redux as well
    console.log("Dispatching new base64 image to Redux:", {
      key,
      imageUrl: base64,
    });
    dispatch(saveImage({ key, imageUrl: base64 }));
  };

  reader.readAsDataURL(blob); // Convert blob to base64
};

const UserImage = ({ size = "60px", propPicturePath = null }) => {
  const [imageUrl, setImageUrl] = useState(defaultAvatar);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = useSelector((state) => state.token);
  const reduxPicturePath = useSelector((state) => state.user.picturePath);
  const cachedImages = useSelector((state) => state.images);
  const dispatch = useDispatch();

  // Determine which picturePath to use
  const picturePath = propPicturePath || reduxPicturePath;

  useEffect(() => {
    if (!picturePath || !token) {
      setLoading(false);
      return;
    }

    const fetchImage = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use cached image if available
        if (cachedImages[picturePath]) {
          setImageUrl(cachedImages[picturePath]);
          return;
        }

        // Otherwise, fetch and cache the image
        const imageUrl = await fetchImageWithCache(
          picturePath,
          `https://sociopedia-6tzx.onrender.com/assets/${picturePath}`,
          token,
          dispatch
        );
        setImageUrl(imageUrl);
      } catch (error) {
        console.error("Error fetching image:", error.message);
        setError(error.message || "Error fetching image.");
        setImageUrl(defaultAvatar);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [picturePath, token, cachedImages, dispatch]);

  return (
    <Box width={size} height={size} position="relative">
      {error ? (
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      ) : (
        <>
          {loading && !imageUrl ? (
            <CircularProgress
              size={24}
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "primary.main",
              }}
            />
          ) : (
            <img
              style={{ objectFit: "cover", borderRadius: "50%" }}
              width={size}
              height={size}
              alt="user"
              src={imageUrl}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default UserImage;
