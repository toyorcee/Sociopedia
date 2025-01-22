import Category from "../models/Category.js";

// Create a new category
export const createCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    if (!name || !subcategories || subcategories.length === 0) {
      return res
        .status(400)
        .json({ message: "Category name and subcategories are required." });
    }

    const newCategory = new Category({
      name,
      subcategories,
    });

    await newCategory.save();

    res
      .status(201)
      .json({
        message: "Category created successfully",
        category: newCategory,
      });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Error creating category" });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("subcategories"); 
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

// Get a single category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "subcategories"
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ category });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Error fetching category" });
  }
};

// Update a category by ID (admin only)
export const updateCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    if (!name || !subcategories || subcategories.length === 0) {
      return res
        .status(400)
        .json({ message: "Category name and subcategories are required." });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, subcategories },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Error updating category" });
  }
};

// Delete a category by ID (admin only)
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Error deleting category" });
  }
};
