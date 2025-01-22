import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  setCategories,
  setFriends,
  setPropertyRentals,
  setTechxtrosavings,
} from "state";
import Navbar from "scenes/navbar";
import UserWidget from "scenes/widgets/UserWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import AdvertWidget from "scenes/widgets/AdvertWidget";
import FriendListWidget from "scenes/widgets/FriendListWidget";

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const state = useSelector((state) => state);
  console.log("State", state);

  const user = useSelector((state) => state.user);
  const { _id } = user || {};
  const loggedInUserId = _id;
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user.friends || []);

  // Determine if the profile belongs to the logged-in user
  const isOwnProfile = true;

  // Category states
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  console.log("category", category);

  //Categories and sub-categories
  const categories = useSelector((state) => state.categories || []);
  const selectSubcategoriesByCategoryId = (state, categoryId) => {
    const category = state.categories.find((cat) => cat._id === categoryId);
    return category ? category.subcategories : [];
  };
  const subcategories = useSelector((state) =>
    selectSubcategoriesByCategoryId(state, category)
  );

  //Techxtrosavings states
  const techxtrosavings = useSelector((state) => state.techxtrosavings || []);
  // State to hold the selected subcategory
  const [selectedTechxtroSubcategory, setSelectedTechxtroSubcategory] =
    useState("");

  //Property rentals state and categories
  // States for selected property rental and subcategory
  const [selectedPropertyRental, setSelectedPropertyRental] = useState("");
  const [selectedSubrentalCategory, setSelectedSubrentalCategory] =
    useState("");

  // Fetch property rentals and subcategories from Redux store
  const propertyRentals = useSelector((state) => state.propertyRentals || []);

  // Selector for fetching subcategories based on the selected property rental
  const selectSubrentalcategoriesById = (state, propertyRentalId) => {
    const rental = state.propertyRentals.find(
      (rental) => rental._id === propertyRentalId
    );
    return rental ? rental.subcategories : [];
  };

  const subrentalCategories = useSelector((state) =>
    selectSubrentalcategoriesById(state, selectedPropertyRental)
  );

  //Category and subcategory change
  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setType("category");
    setSubcategory("");
  };

  const handleSubcategoryChange = (event) => {
    setSubcategory(event.target.value);
    setType("subcategory");
  };

  //Techxtrosavings and subcategory change
  const allSubcategories =
    techxtrosavings.length > 0 ? techxtrosavings[0].subcategories : [];

  // Handle changes in subcategory selection
  const handleTechxtroSubcategoryChange = (event) => {
    setSelectedTechxtroSubcategory(event.target.value);
    setType("techxtrosavings");
  };

  // Handle changes for property rentals and subcategories
  const handlePropertyRentalChange = (event) => {
    setSelectedPropertyRental(event.target.value);
    setType("propertyRental");
    setSelectedSubrentalCategory("");
  };

  const handleSubrentalCategoryChange = (event) => {
    setSelectedSubrentalCategory(event.target.value);
    setType("subcategoryPropertyRental");
  };

  const handleSearch = async () => {
    const searchParams = {
      category: category || "",
      subcategory: subcategory || "",
      techxtroSubcategory: selectedTechxtroSubcategory || "",
      propertyRental: selectedPropertyRental || "",
      subcategoryPropertyRental: selectedSubrentalCategory || "",
      type,
    };

    console.log("Search Parameters:", searchParams); // Log the parameters

    // Perform the search and set the results
    await performSearch(searchParams);

    // After performing the search, navigate to the search page with the query string and results
    const queryString = new URLSearchParams(searchParams).toString();

    navigate(`/search?q=${queryString}`, {
      state: { results: searchResults }, // Passing the search results to the search page
    });
  };

  const performSearch = async (params) => {
    const queryString = new URLSearchParams(params).toString();

    if (!queryString.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const url = `https://sociopedia-6tzx.onrender.com/search?keyword=${queryString}&type=${type}&page=1&limit=9`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.json();
        console.error("Error in response:", errorText);
        throw new Error(errorText.message || "No results found.");
      }

      const data = await response.json();
      setSearchResults(data || []);
    } catch (error) {
      console.error("Search error:", error.message);
    }
  };

  // Fetch Categories
  const fetchCategories = async (token) => {
    try {
      const response = await fetch(
        "https://sociopedia-6tzx.onrender.com/category",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch categories.");
      }

      const data = await response.json();
      // console.log("fetchCategories function", data);

      dispatch(setCategories(data.categories));
    } catch (err) {
      console.error("[FETCH CATEGORIES] Error:", err.message);
    }
  };

  // Fetch Techxtrosavings
  const fetchTechxtrosavings = async (token) => {
    try {
      const response = await fetch(
        "https://sociopedia-6tzx.onrender.com/techxtro-savings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch techxtrosavings services."
        );
      }

      const data = await response.json();
      console.log("fetchTechxtrosavings", data);

      dispatch(setTechxtrosavings(data.techxtrosavings));
    } catch (err) {
      console.error("[FETCH TECHXTROSAVINGS] Error:", err.message);
    }
  };

  // Fetch Property Rentals
  const fetchPropertyRentals = async (token) => {
    try {
      const response = await fetch(
        "https://sociopedia-6tzx.onrender.com/property-rentals",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch techxtrosavings services."
        );
      }

      const data = await response.json();
      console.log("fetchPropertyRentals", data);

      dispatch(setPropertyRentals(data.propertyRentals));
    } catch (err) {
      console.error("[FETCH PROPERTY RENTALS] Error:", err.message);
    }
  };

  // Fetch friends and update Redux state
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        if (!_id) return;

        const response = await fetch(
          `https://sociopedia-6tzx.onrender.com/users/${_id}/friends`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch friends");

        const data = await response.json();
        dispatch(setFriends({ friends: data }));
      } catch (err) {
        console.error(err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [_id, token, dispatch]);

  useEffect(() => {
    if (token) {
      if (!categories.length) {
        console.log("Fetching categories...");
        fetchCategories(token);
      }

      if (!techxtrosavings.length) {
        console.log("Fetching techxtrosavings...");
        fetchTechxtrosavings(token);
      }

      if (!propertyRentals.length) {
        console.log("Fetching property rentals...");
        fetchPropertyRentals(token);
      }
    }
  }, [
    token,
    categories.length,
    techxtrosavings.length,
    propertyRentals.length,
    dispatch,
  ]);

  if (loading) {
    return (
      <Box
        width="100%"
        height="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        width="100%"
        height="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Navbar />
      <Box
        width="100%"
        padding="2rem 6%"
        display="flex"
        flexDirection={isNonMobileScreens ? "row" : "column"}
        gap="2rem"
        justifyContent="space-between"
      >
        {/* Left Column - UserWidget and Services */}
        <Box
          display="flex"
          flexDirection="column"
          flexBasis={isNonMobileScreens ? "26%" : "100%"}
          gap="2rem"
        >
          {/* UserWidget */}
          <Box>
            <UserWidget userId={loggedInUserId} isOwnProfile={isOwnProfile} />
          </Box>
        </Box>

        {/* Right Column - Posts and MyPostWidgets */}
        <Box
          flexBasis={isNonMobileScreens ? "42%" : "100%"}
          mt={isNonMobileScreens ? undefined : "2rem"}
        >
          <MyPostWidget />
          <PostsWidget />
        </Box>

        {/* Advert and Friend List Widgets */}
        {isNonMobileScreens && (
          <Box flexBasis="26%">
            <AdvertWidget />
            <Box m="2rem 0" />
            <FriendListWidget isProfilePage={false} friends={friends} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HomePage;
