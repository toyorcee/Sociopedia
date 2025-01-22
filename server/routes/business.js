import express from "express";
import {
  createBusiness,
  getBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
} from "../controllers/business.js";
import { verifyToken } from "../middleware/auth.js";
import { verifyBusinessOwner } from "../middleware/verifyBusinessOwner.js";

const router = express.Router();

// Register a new business
router.post("/", verifyToken, verifyBusinessOwner, createBusiness);

// Get all businesses (public)
router.get("/", getBusinesses);

// Get a single business by ID (public)
router.get("/:id", getBusinessById);

// Update a business (admin or owner only)
router.put("/:id", verifyToken, verifyBusinessOwner, updateBusiness);

// Delete a business (admin or owner only)
router.delete("/:id", verifyToken, verifyBusinessOwner, deleteBusiness);

export default router;
