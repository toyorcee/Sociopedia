import User from "../models/User.js";
import Post from "../models/Post.js";
import Category from "../models/Category.js";
import Techxtrosavings from "../models/Techxtrosavings.js";
import PropertyRental from "../models/PropertyRental.js";

export const search = async (req, res) => {
  try {
    // Extract query parameters
    const { keyword, type, page = 1, limit = 9 } = req.query;
    console.log("Search params:", { keyword, type, page, limit });
    const searchRegex = new RegExp(keyword, "i");

    // Initialize filters based on searchParams
    const searchParams = {
      category: req.query.category,
      subcategory: req.query.subcategory,
      techxtroSubcategory: req.query.selectedTechxtroSubcategory,
      propertyRental: req.query.selectedPropertyRental,
      subcategoryPropertyRental: req.query.selectedSubrentalCategory,
    };

    const categoryFilter = searchParams.category
      ? { category: searchParams.category }
      : {};
    const subcategoryFilter = searchParams.subcategory
      ? { "subcategories.name": searchParams.subcategory }
      : {};
    const techxtroSubcategoryFilter = searchParams.techxtroSubcategory
      ? { "subcategories.name": searchParams.techxtroSubcategory }
      : {};
    const propertyRentalFilter = searchParams.propertyRental
      ? { "propertyRentals.name": searchParams.propertyRental }
      : {};
    const subcategoryPropertyRentalFilter =
      searchParams.subcategoryPropertyRental
        ? { "subcategories.name": searchParams.subcategoryPropertyRental }
        : {};

    // Initialize result counts for filtered documents
    const userCount = await User.countDocuments({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { location: searchRegex },
      ],
      ...categoryFilter,
      ...subcategoryFilter,
      ...techxtroSubcategoryFilter,
      ...propertyRentalFilter,
      ...subcategoryPropertyRentalFilter,
    });
    console.log("User count result:", userCount);

    const postCount = await Post.countDocuments({
      $or: [
        { description: searchRegex },
        { location: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
      ],
      ...categoryFilter,
      ...subcategoryFilter,
      ...techxtroSubcategoryFilter,
      ...propertyRentalFilter,
      ...subcategoryPropertyRentalFilter,
    });
    console.log("Post count result:", postCount);

    const categoryCount = await Category.countDocuments({
      ...categoryFilter,
      ...subcategoryFilter,
    });
    console.log("Category count result:", categoryCount);

    const techxtroSavingsCount = await Techxtrosavings.countDocuments({
      ...techxtroSubcategoryFilter,
    });
    console.log("TechxtroSavings count result:", techxtroSavingsCount);

    const propertyRentalCount = await PropertyRental.countDocuments({
      ...propertyRentalFilter,
      ...subcategoryPropertyRentalFilter,
    });
    console.log("PropertyRental count result:", propertyRentalCount);

    let results = [];

    // Fetch results based on type
    if (type === "user") {
      console.log("Fetching results for type: user");
      results = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { location: searchRegex },
        ],
      })
        .limit(limit)
        .skip((page - 1) * limit)
        .select("firstName lastName picturePath location friends")
        .lean()
        .then((users) => users.map((user) => ({ ...user, type: "user" })));
    } else if (type === "post") {
      console.log("Fetching results for type: post");
      results = await Post.find({
        $or: [
          { description: searchRegex },
          { location: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      })
        .limit(limit)
        .skip((page - 1) * limit)
        .select("description userId location firstName lastName picturePath")
        .lean()
        .then((posts) => posts.map((post) => ({ ...post, type: "post" })));
    } else if (type === "category") {
      console.log("Fetching results for type: category");
      results = await Category.find({
        $or: [{ name: searchRegex }],
      })
        .limit(limit)
        .skip((page - 1) * limit)
        .select("name subcategories")
        .lean()
        .then((categories) =>
          categories.map((category) => ({ ...category, type: "category" }))
        );
    } else if (type === "subcategory") {
      console.log("Fetching results for type: subcategory");
      results = await Category.find({
        "subcategories.name": searchRegex,
      })
        .limit(limit)
        .skip((page - 1) * limit)
        .select("name subcategories")
        .lean()
        .then((categories) =>
          categories.flatMap((category) =>
            category.subcategories
              .filter((subcategory) => searchRegex.test(subcategory.name))
              .map((subcategory) => ({
                ...subcategory,
                type: "subcategory",
                categoryName: category.name,
              }))
          )
        );
    } else if (type === "techxtrosavings") {
      console.log("Fetching results for type: techxtrosavings");
      results = await Techxtrosavings.find({
        "subcategories.name": searchRegex,
      })
        .limit(limit)
        .skip((page - 1) * limit)
        .select("name subcategories")
        .lean()
        .then((techxtrosavings) =>
          techxtrosavings.flatMap((techxtro) =>
            techxtro.subcategories
              .filter((subcategory) => searchRegex.test(subcategory.name))
              .map((subcategory) => ({
                ...subcategory,
                type: "techxtrosavings",
                techxtroName: techxtro.name,
              }))
          )
        );
    } else if (type === "propertyRental") {
      console.log("Fetching results for type: propertyRental");
      results = await PropertyRental.find({
        "subcategories.name": searchRegex,
      })
        .limit(limit)
        .skip((page - 1) * limit)
        .select("name subcategories")
        .lean()
        .then((propertyRentals) =>
          propertyRentals.flatMap((rental) =>
            rental.subcategories
              .filter((subcategory) => searchRegex.test(subcategory.name))
              .map((subcategory) => ({
                ...subcategory,
                type: "propertyRental",
                rentalName: rental.name,
              }))
          )
        );
    } else {
      console.log(
        "Fetching results for all types (user, post, category, subcategory)"
      );
      results = [
        ...(await User.find({
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { location: searchRegex },
          ],
        })
          .limit(limit)
          .skip((page - 1) * limit)
          .select("firstName lastName picturePath location friends")
          .lean()
          .then((users) => users.map((user) => ({ ...user, type: "user" })))),
        ...(await Post.find({
          $or: [
            { description: searchRegex },
            { location: searchRegex },
            { firstName: searchRegex },
            { lastName: searchRegex },
          ],
        })
          .limit(limit)
          .skip((page - 1) * limit)
          .select("description userId location firstName lastName picturePath")
          .lean()
          .then((posts) => posts.map((post) => ({ ...post, type: "post" })))),
        ...(await Category.find({
          $or: [{ name: searchRegex }],
        })
          .limit(limit)
          .skip((page - 1) * limit)
          .select("name subcategories")
          .lean()
          .then((categories) =>
            categories.map((category) => ({ ...category, type: "category" }))
          )),
        ...(await Techxtrosavings.find({
          "subcategories.name": searchRegex,
        })
          .limit(limit)
          .skip((page - 1) * limit)
          .select("name subcategories")
          .lean()
          .then((techxtrosavings) =>
            techxtrosavings.flatMap((techxtro) =>
              techxtro.subcategories
                .filter((subcategory) => searchRegex.test(subcategory.name))
                .map((subcategory) => ({
                  ...subcategory,
                  type: "techxtrosavings",
                  techxtroName: techxtro.name,
                }))
            )
          )),
        ...(await PropertyRental.find({
          "subcategories.name": searchRegex,
        })
          .limit(limit)
          .skip((page - 1) * limit)
          .select("name subcategories")
          .lean()
          .then((propertyRentals) =>
            propertyRentals.flatMap((rental) =>
              rental.subcategories
                .filter((subcategory) => searchRegex.test(subcategory.name))
                .map((subcategory) => ({
                  ...subcategory,
                  type: "propertyRental",
                  rentalName: rental.name,
                }))
            )
          )),
      ];
    }

    console.log("Search response:", results);

    res.status(200).json({
      userCount,
      postCount,
      categoryCount,
      techxtrosavingsCount,
      propertyRentalCount,
      results,
      currentPage: page,
      totalPages: Math.ceil(results.length / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
