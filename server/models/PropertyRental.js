import mongoose from "mongoose";

const SubcategorySchema = new mongoose.Schema({
  name: { type: String, required: true }, 
});

const PropertyRentalSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  subcategories: [SubcategorySchema],    
});

const PropertyRental = mongoose.model("PropertyRental", PropertyRentalSchema);

export default PropertyRental;
