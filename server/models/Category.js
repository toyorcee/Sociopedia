import mongoose from "mongoose";

const SubcategorySchema = new mongoose.Schema({
  name: { type: String, required: true }, // Name of the subcategory
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true }, // Name of the category
  subcategories: [SubcategorySchema], // Array of subcategories
});

const Category = mongoose.model("Category", CategorySchema);
export default Category;
