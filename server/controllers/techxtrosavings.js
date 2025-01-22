import Techxtrosavings from "../models/Techxtrosavings.js";

// Create a new Techxtrosaving
export const createTechxtrosaving = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    if (!name || !subcategories || subcategories.length === 0) {
      return res
        .status(400)
        .json({ message: "Name and subcategories are required." });
    }

    const newTechxtrosaving = new Techxtrosavings({ name, subcategories });
    await newTechxtrosaving.save();

    res.status(201).json({
      message: "Techxtrosaving created successfully",
      techxtrosaving: newTechxtrosaving,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating Techxtrosaving" });
  }
};

// Get all Techxtrosavings
export const getTechxtrosavings = async (req, res) => {
  try {
    const techxtrosavings = await Techxtrosavings.find();
    res.status(200).json({ techxtrosavings });
  } catch (error) {
    res.status(500).json({ message: "Error fetching Techxtrosavings" });
  }
};

// Get a single Techxtrosaving by ID
export const getTechxtrosavingById = async (req, res) => {
  try {
    const techxtrosaving = await Techxtrosavings.findById(req.params.id);
    if (!techxtrosaving) {
      return res.status(404).json({ message: "Techxtrosaving not found" });
    }
    res.status(200).json({ techxtrosaving });
  } catch (error) {
    res.status(500).json({ message: "Error fetching Techxtrosaving" });
  }
};

// Update a Techxtrosaving
export const updateTechxtrosaving = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    const techxtrosaving = await Techxtrosavings.findByIdAndUpdate(
      req.params.id,
      { name, subcategories },
      { new: true }
    );

    if (!techxtrosaving) {
      return res.status(404).json({ message: "Techxtrosaving not found" });
    }

    res
      .status(200)
      .json({ message: "Techxtrosaving updated successfully", techxtrosaving });
  } catch (error) {
    res.status(500).json({ message: "Error updating Techxtrosaving" });
  }
};

// Delete a Techxtrosaving
export const deleteTechxtrosaving = async (req, res) => {
  try {
    const techxtrosaving = await Techxtrosavings.findByIdAndDelete(
      req.params.id
    );

    if (!techxtrosaving) {
      return res.status(404).json({ message: "Techxtrosaving not found" });
    }

    res.status(200).json({ message: "Techxtrosaving deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Techxtrosaving" });
  }
};
