import express from "express";
import {
  createTechxtrosaving,
  getTechxtrosavings,
  getTechxtrosavingById,
  updateTechxtrosaving,
  deleteTechxtrosaving,
} from "../controllers/techxtrosavings.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Create a new Techxtrosaving (admin only)
router.post("/create", verifyToken, verifyAdmin, createTechxtrosaving);

// Get all Techxtrosavings (public)
router.get("/", getTechxtrosavings);

// Get a single Techxtrosaving by ID (public)
router.get("/:id", getTechxtrosavingById);

// Update a Techxtrosaving (admin only)
router.put("/:id", verifyToken, verifyAdmin, updateTechxtrosaving);

// Delete a Techxtrosaving (admin only)
router.delete("/:id", verifyToken, verifyAdmin, deleteTechxtrosaving);

export default router;
