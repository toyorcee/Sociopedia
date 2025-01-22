import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    lastName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    email: {
      type: String,
      required: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 5,
    },
    picturePath: {
      type: String,
      default: "",
    },
    friends: {
      type: Array,
      default: [],
    },
    isAdmin: {
      type: Boolean,
      default: false,
      required: true,
    },
    isBusinessOwner: { type: Boolean, default: false }, 
    location: String,
    occupation: String,
    viewedProfile: Number,
    impressions: Number,
  },
  { timestamps: true }
);

// Add indexes to UserSchema
UserSchema.index({ email: 1 }); // Unique index for email
UserSchema.index({ firstName: "text", lastName: "text" }); // Text index for firstName and lastName

const User = mongoose.model("User", UserSchema);
export default User;
