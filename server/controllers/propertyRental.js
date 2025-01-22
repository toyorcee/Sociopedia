import PropertyRental from "../models/PropertyRental.js";

// Create a new PropertyRental
export const createPropertyRental = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    if (!name || !subcategories || subcategories.length === 0) {
      return res
        .status(400)
        .json({ message: "Name and subcategories are required." });
    }

    const newPropertyRental = new PropertyRental({
      name,
      subcategories,
    });

    await newPropertyRental.save();

    res.status(201).json({
      message: "Property Rental created successfully",
      propertyRental: newPropertyRental,
    });
  } catch (error) {
    console.error("Error creating property rental:", error);
    res.status(500).json({ message: "Error creating property rental" });
  }
};

// Get all PropertyRentals
export const getPropertyRentals = async (req, res) => {
  try {
    const propertyRentals = await PropertyRental.find();
    res.status(200).json({ propertyRentals });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Property Rentals",
      error: error.message,
    });
  }
};

// Get a single PropertyRental by ID
export const getPropertyRentalById = async (req, res) => {
  try {
    const propertyRental = await PropertyRental.findById(req.params.id);
    if (!propertyRental) {
      return res.status(404).json({ message: "Property Rental not found" });
    }
    res.status(200).json({ propertyRental });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Property Rental",
      error: error.message,
    });
  }
};

// Update a PropertyRental
export const updatePropertyRental = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    const propertyRental = await PropertyRental.findByIdAndUpdate(
      req.params.id,
      { name, subcategories },
      { new: true }
    );

    if (!propertyRental) {
      return res.status(404).json({ message: "Property Rental not found" });
    }

    res.status(200).json({
      message: "Property Rental updated successfully",
      propertyRental,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating Property Rental",
      error: error.message,
    });
  }
};

// Delete a PropertyRental
export const deletePropertyRental = async (req, res) => {
  try {
    const propertyRental = await PropertyRental.findByIdAndDelete(
      req.params.id
    );

    if (!propertyRental) {
      return res.status(404).json({ message: "Property Rental not found" });
    }

    res.status(200).json({ message: "Property Rental deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting Property Rental",
      error: error.message,
    });
  }
};
