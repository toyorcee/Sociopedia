import express from "express";
import {
  createPropertyRental,
  getPropertyRentals,
  getPropertyRentalById,
  updatePropertyRental,
  deletePropertyRental,
} from "../controllers/propertyRental.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Create a new PropertyRental (admin only)
router.post("/create", verifyToken, verifyAdmin, createPropertyRental);

// Get all PropertyRentals (public)
router.get("/", getPropertyRentals);

// Get a single PropertyRental by ID (public)
router.get("/:id", getPropertyRentalById);

// Update a PropertyRental (admin only)
router.put("/:id", verifyToken, verifyAdmin, updatePropertyRental);

// Delete a PropertyRental (admin only)
router.delete("/:id", verifyToken, verifyAdmin, deletePropertyRental);

export default router;
