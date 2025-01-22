import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const updateIsBusinessOwnerField = async () => {
  try {
    mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB.");

    const users = await User.find(); // Fetch all users
    for (const user of users) {
      if (user.isBusinessOwner === undefined) {
        user.isBusinessOwner = false;
        await user.save();
      }
    }
    console.log("Updated all users with isBusinessOwner field");
  } catch (error) {
    console.error("Error updating users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Mongodb disconnected successfully");
  }
};

updateIsBusinessOwnerField();
