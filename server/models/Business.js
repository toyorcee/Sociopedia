const BusinessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], required: true },
      index: "2dsphere",
      required: true,
    },
    pricing: {
      price: { type: Number, required: true },
      unit: { type: String, enum: ["hour", "day", "service"], required: true },
    },
    portfolio: [
      {
        mediaType: { type: String, enum: ["image", "video"], required: true },
        url: { type: String, required: true },
      },
    ],
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    openingHours: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        open: { type: String }, // e.g., "9:00 AM"
        close: { type: String }, // e.g., "6:00 PM"
        isOpen: { type: Boolean, default: true }, // Optional: Flag to mark if the business is open on this day
      },
    ],
    socialMediaLinks: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
    },
  },
  { timestamps: true }
);

BusinessSchema.index({ location: "2dsphere" });

const Business = mongoose.model("Business", BusinessSchema);
export default Business;
