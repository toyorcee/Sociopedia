import Business from "../models/Business.js";
import User from "../models/User.js";

// Register a new business
export const createBusiness = async (req, res) => {
  try {
    // Extract all fields from the request body
    const {
      name,
      category,
      subcategory,
      address,
      portfolio,
      description,
      pricing,
      contact,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !category ||
      !subcategory ||
      !address ||
      !portfolio ||
      !description ||
      !contact ||
      !pricing
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled." });
    }

    const ownerId = req.user.id;

    // Geocoding address to get coordinates
    const location = await getCoordinatesFromAddress(address);

    const newBusiness = new Business({
      name,
      category,
      subcategory,
      description,
      address,
      pricing,
      portfolio,
      contact,
      userId: ownerId,
      location,
    });

    await newBusiness.save();

    // Mark user as business owner
    const user = await User.findById(ownerId);
    if (user) {
      user.isBusinessOwner = true; // Set isBusinessOwner to true for the user
      await user.save();
    }

    res.status(201).json({
      message: "Business registered successfully",
      business: newBusiness,
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering business", error });
  }
};

// Get all businesses (optionally, add search filters)
export const getBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find().populate("category userId");
    res.status(200).json({ businesses });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    res.status(500).json({ message: "Error fetching businesses" });
  }
};

// Get a single business by ID
export const getBusinessById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).populate(
      "category userId"
    );
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    res.status(200).json({ business });
  } catch (error) {
    console.error("Error fetching business:", error);
    res.status(500).json({ message: "Error fetching business" });
  }
};

// Update business details (admin or owner)
export const updateBusiness = async (req, res) => {
  try {
    const {
      name,
      category,
      subcategory,
      address,
      portfolio,
      description,
      pricing,
      contact,
      openingHours,
      socialMediaLinks,
    } = req.body;

    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Check if the user is the owner of the business or an admin
    if (business.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this business" });
    }

    // If address is updated, geocode to update location
    let updatedLocation = business.location;
    if (address && address !== business.address) {
      updatedLocation = await getCoordinatesFromAddress(address);
    }

    // Handle portfolio update (if a portfolio item is being added, updated, or removed)
    let updatedPortfolio = [...business.portfolio];
    if (portfolio && portfolio.length) {
      // Add or update items in the portfolio array
      updatedPortfolio = updatedPortfolio.map((item) => {
        const updatedItem = portfolio.find((p) => p.url === item.url);
        if (updatedItem) {
          return { ...item, ...updatedItem }; // Update existing item
        }
        return item;
      });
      // Add new items if they don't already exist
      updatedPortfolio.push(
        ...portfolio.filter((p) => !updatedPortfolio.includes(p))
      );
    }

    // Handle openingHours update (update specific day details if provided)
    let updatedOpeningHours = business.openingHours;
    if (openingHours && openingHours.length) {
      updatedOpeningHours = updatedOpeningHours.map((item) => {
        const updatedDay = openingHours.find((day) => day.day === item.day);
        if (updatedDay) {
          return { ...item, ...updatedDay }; // Update only provided fields for the day
        }
        return item;
      });
    }

    // Handle contact update (update phone or email if provided)
    const updatedContact = {
      ...business.contact,
      ...(contact?.phone && { phone: contact.phone }),
      ...(contact?.email && { email: contact.email }),
    };

    // Handle pricing update (update price or unit if provided)
    const updatedPricing = {
      ...(pricing?.price && { price: pricing.price }),
      ...(pricing?.unit && { unit: pricing.unit }),
    };

    // Handle socialMediaLinks update (update links if provided)
    const updatedSocialMediaLinks = {
      ...business.socialMediaLinks,
      ...(socialMediaLinks?.facebook && {
        facebook: socialMediaLinks.facebook,
      }),
      ...(socialMediaLinks?.twitter && { twitter: socialMediaLinks.twitter }),
      ...(socialMediaLinks?.instagram && {
        instagram: socialMediaLinks.instagram,
      }),
    };

    const updatedBusiness = await Business.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        subcategory,
        address,
        portfolio: updatedPortfolio,
        description,
        pricing: updatedPricing,
        contact: updatedContact,
        openingHours: updatedOpeningHours,
        location: updatedLocation,
        socialMediaLinks: updatedSocialMediaLinks,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Business updated successfully",
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("Error updating business:", error);
    res.status(500).json({ message: "Error updating business" });
  }
};

// Delete a business (admin or owner)
export const deleteBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    if (business.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this business" });
    }

    await Business.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Business deleted successfully" });
  } catch (error) {
    console.error("Error deleting business:", error);
    res.status(500).json({ message: "Error deleting business" });
  }
};

// Helper function to get coordinates from address (using a geocoding service)
const getCoordinatesFromAddress = async (address) => {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    address
  )}.json?access_token=YOUR_MAPBOX_ACCESS_TOKEN`;

  try {
    const response = await axios.get(url);
    const { features } = response.data;
    if (features && features.length > 0) {
      const coordinates = features[0].geometry.coordinates; // [longitude, latitude]
      return { type: "Point", coordinates };
    } else {
      throw new Error("Address not found");
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    return { type: "Point", coordinates: [0, 0] }; // Default coordinates in case of error
  }
};
