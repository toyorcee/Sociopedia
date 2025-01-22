import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} from "../controllers/category.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Create a new category (admin only)
router.post("/create", verifyToken, verifyAdmin, createCategory);

// Get all categories (public)
router.get("/", getCategories);

// Get a single category by ID (public)
router.get("/:id", getCategoryById);

// Update a category (admin only)
router.put("/:id", verifyToken, verifyAdmin, updateCategory);

// Delete a category (admin only)
router.delete("/:id", verifyToken, verifyAdmin, deleteCategory);

export default router;
