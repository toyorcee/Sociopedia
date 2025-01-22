import mongoose from "mongoose";

const SubcategorySchema = new mongoose.Schema({
  name: { type: String, required: true }, 
});

const TechxtrosavingsSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  subcategories: [SubcategorySchema], 
});

const Techxtrosavings = mongoose.model("Techxtrosaving", TechxtrosavingsSchema);
export default Techxtrosavings;
