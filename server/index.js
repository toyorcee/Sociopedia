import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import searchRoutes from "./routes/search.js";
import categoryRoutes from "./routes/category.js";
import techxtrosavingsRoutes from "./routes/techxtrosavings.js";
import propertyRentalsRoutes from "./routes/propertyRental.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
// import User from "./models/User.js";
// import Post from "./models/Post.js";
// import Comment from "./models/Comment.js";
// import Reply from "./models/Reply.js";
import { comments, replys, users } from "./data/index.js";
import { createAdvert } from "./controllers/advert.js";

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(
  cors({
    origin: process.env.BASE_URL || "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE,PATCH",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.use(express.static(path.join(__dirname, "client/build")));

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), register);
app.post("/posts/create", verifyToken, upload.single("picture"), createPost);
// CREATE Ad
app.post(
  "/adverts/create",
  verifyToken,
  upload.single("adPicture"),
  createAdvert
);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/adverts", postRoutes);
app.use("/search", searchRoutes);
app.use("/category", categoryRoutes);
app.use("/techxtro-savings", techxtrosavingsRoutes);
app.use("/property-rentals", propertyRentalsRoutes);

// Catch-all route to serve React's index.html for frontend routes
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client/build", "index.html"));
});

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Mongodb is connected");
    //start server
    app.listen(PORT, () => console.log(`Server running on Port: ${PORT}`));

    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
    // Comment.insertMany(comments);
    // Reply.insertMany(replys);
  })
  .catch((error) => console.log(`${error} did not connect`));
