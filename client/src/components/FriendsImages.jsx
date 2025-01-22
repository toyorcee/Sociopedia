import React, { useEffect, useState } from "react";
import { openDB } from "idb";

const FriendsImages = ({ friendId, picturePath }) => {
  const [image, setImage] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
      const db = await openDB("UserImageDB", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("images")) {
            db.createObjectStore("images");
          }
        },
      });

      const uniqueKey = `${friendId}-${picturePath}`;
      const cachedImage = await db.get("images", uniqueKey);

      if (cachedImage) {
        setImage(cachedImage);
      } else {
        try {
          const response = await fetch(
            `http://localhost:5000/assets/${picturePath}`
          );
          const blob = await response.blob();
          const reader = new FileReader();

          reader.onloadend = () => {
            const base64 = reader.result;
            db.put("images", base64, uniqueKey);
            setImage(base64);
          };

          reader.readAsDataURL(blob);
        } catch (error) {
          console.error("Error fetching image:", error);
        }
      }
    };

    fetchImage();
  }, [friendId, picturePath]);

  return (
    <img
      src={image || "/default-avatar.png"}
      alt="Friend"
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  );
};

export default FriendsImages;
