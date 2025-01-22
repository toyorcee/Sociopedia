import Advert from "../models/Advert.js";
import User from "../models/User.js";

export const createAdvert = async (req, res) => {
  try {
    // Get the userId from the authenticated user
    const userId = req.user.id;

    // Find the user in the database
    const user = await User.findById(userId);

    // Check if the user does not exist
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is not an admin
    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to create an advert." });
    }

    // Extract advert details from the request body
    const { title, companyName, companyWebsite, description } = req.body;

    // Get the adPicturePath from Multer
    const adPicturePath = req.file ? req.file.path : null;
    console.log("req.file ", req.file);

    if (!adPicturePath) {
      return res
        .status(400)
        .json({ message: "Ad image is required for the advert." });
    }

    // Create a new advertisement
    const newAdvert = new Advert({
      title,
      adPicturePath,
      companyName,
      companyWebsite,
      description,
      userId,
    });

    // Save the new advert
    await newAdvert.save();

    // Return the newly created advert
    res.status(201).json({ newAdvert });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getAdverts = async (req, res) => {
  try {
    const adverts = await Advert.find();

    if (!adverts) {
      return res.status(404).json({ message: "Advert not found" });
    }

    res.status(200).json({ adverts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const updateAdvert = async (req, res) => {
  try {
    // Get the userId from the authenticated user
    const userId = req.user.id;

    // Find the user in the database
    const user = await User.findById(userId);

    // Check if the user does not exist
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is not an admin
    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this advert." });
    }

    // Find and update the advert by ID
    const advert = await Advert.findByIdAndUpdate(
      req.params.id,
      { ...req.body }, // Update with the provided data
      { new: true } // Return the updated advert
    );

    if (!advert) {
      return res.status(404).json({ message: "Advert not found" });
    }

    // Return the updated advert
    res.status(200).json({ advert });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: err.message });
  }
};

export const deleteAdvert = async (req, res) => {
  try {
    // Get the userId from the authenticated user
    const userId = req.user.id;

    // Find the user in the database
    const user = await User.findById(userId);

    // Check if the user does not exist
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is not an admin
    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this advert." });
    }

    // Find and delete the advert by ID
    const advert = await Advert.findByIdAndDelete(req.params.id);

    if (!advert) {
      return res.status(404).json({ message: "Advert not found" });
    }

    // Return success message
    res.status(200).json({ message: "Advert deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: err.message });
  }
};
