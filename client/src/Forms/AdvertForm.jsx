import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  FormControl,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { setAdvert } from "state";
import { toast } from "react-toastify";

const AdvertForm = ({ isOpen, handleClose }) => {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [description, setDescription] = useState("");
  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB.");
      return;
    }
    setImage(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("companyName", companyName);
    formData.append("companyWebsite", companyWebsite);
    formData.append("description", description);
    if (image) formData.append("adPicture", image);

    try {
      const response = await fetch(
        "https://sociopedia-6tzx.onrender.com/adverts/create",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating advert.");
      }

      const newAdvert = await response.json();
      dispatch(setAdvert({ advert: newAdvert }));
      toast.success("Advert created successfully!");
      handleClose();
    } catch (err) {
      toast.error(
        err.message || "An error occurred while creating the advert."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <Box
        sx={{
          maxWidth: 500,
          margin: "auto",
          padding: "2rem",
          backgroundColor: "background.paper",
          borderRadius: 1,
          boxShadow: 3,
        }}
      >
        <Typography variant="h6" mb={2}>
          Create Advertisement
        </Typography>
        <FormControl fullWidth>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Company Website"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            margin="dense"
          />
          <Button variant="contained" component="label" sx={{ mt: 2, mb: 2 }}>
            Upload Ad Picture
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
          </Button>
          {image && <Typography>{image.name}</Typography>}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Submit"}
          </Button>
        </FormControl>
      </Box>
    </Modal>
  );
};

export default AdvertForm;
