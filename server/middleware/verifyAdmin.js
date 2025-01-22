export const verifyAdmin = (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
  } catch (err) {
    console.error("[verifyAdmin] Error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};
