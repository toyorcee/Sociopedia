import User from "../models/User.js"; // Make sure to import the User model

export const verifyBusinessOwner = async (req, res, next) => {
  try {
    // Check if the user is a business owner
    const user = await User.findById(req.user.id); // assuming req.user.id is the logged-in user's ID
    if (!user || !user.isBusinessOwner) {
      return res
        .status(403)
        .json({
          message:
            "Access denied. Only business owners can perform this action.",
        });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
