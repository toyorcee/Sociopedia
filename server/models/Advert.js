import mongoose from "mongoose";

const AdvertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    adPicturePath: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    companyWebsite: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Advert = mongoose.model("Advert", AdvertSchema);
export default Advert;
