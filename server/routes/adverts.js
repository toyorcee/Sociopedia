import express from "express";
import { deleteAdvert, getAdverts, updateAdvert } from "../controllers/advert";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// READ Ad
router.get("/adverts", verifyToken, getAdverts); // Authenticated users can view adverts

// UPDATE Ad
router.put("/adverts/:id", verifyToken, updateAdvert); // Admin-only route for updating an advert

// DELETE Ad
router.delete("/adverts/:id", verifyToken, deleteAdvert); // Admin-only route for deleting an advert
