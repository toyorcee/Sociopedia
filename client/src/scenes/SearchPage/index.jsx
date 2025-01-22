import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Grid,
  MenuItem,
  Select,
  TextField,
  useTheme,
  Drawer,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import SwipeableViews from "react-swipeable-views";
import { autoPlay } from "react-swipeable-views-utils";
import { motion } from "framer-motion";
import debounce from "lodash.debounce";
import { useSelector } from "react-redux";
import UserImage from "components/UserImage";
import Navbar from "scenes/navbar";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const theme = useTheme();
  const neutralLight = theme.palette.neutral.light;
  const dark = theme.palette.neutral.dark;
  const background = theme.palette.background.default;
  const primaryLight = theme.palette.primary.light;
  const alt = theme.palette.background.alt;

  const cardStyle = {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
    border: `1px solid`,
    borderImageSource: "linear-gradient(45deg, pink, purple)",
    borderImageSlice: 1,
    boxShadow:
      theme.palette.mode === "dark"
        ? "0px 4px 10px rgba(0, 0, 0, 0.3)"
        : "0px 4px 10px rgba(0, 0, 0, 0.1)",
    padding: "1rem",
    borderRadius: "8px",
  };

  const buttonStyle = {
    backgroundColor: theme.palette.primary.light,
    color: "#fff",
    "&:hover": {
      backgroundColor: theme.palette.primary.main,
    },
  };

  const isLargeScreen = useMediaQuery("(min-width:1024px)");

  // Retrieve state results from location state
  const stateResults = location.state?.results || {};

  // Retrieve query parameters
  const queryParams = new URLSearchParams(location.search);

  // States
  const [type, setType] = useState(queryParams.get("type") || "user");
  const token = useSelector((state) => state.token);
  const [keyword, setKeyword] = useState(queryParams.get("q") || "");
  const [query, setQuery] = useState(queryParams.get("q") || "");
  const [searchResults, setSearchResults] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 9;
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width:768px)");
  const [fetchTriggered, setFetchTriggered] = useState(false);

  const AutoPlaySwipeableViews = autoPlay(SwipeableViews);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const debouncedSearch = debounce(() => fetchSearchResults(), 500);

  // Fetch search results function
  const fetchSearchResults = async () => {
    setLoading(true);

    if (!keyword.trim()) {
      setSearchResults([]);
      setFetchTriggered(false);
      setLoading(false);
      return;
    }

    try {
      const url = `https://sociopedia-6tzx.onrender.com/search?keyword=${encodeURIComponent(
        query
      )}&type=${type}&page=${page}&limit=${limit}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await response.text();
      if (!response.ok) throw new Error(text);

      const data = JSON.parse(text);
      setSearchResults(data || []);
    } catch (error) {
      console.error("Search error:", error.message);
    } finally {
      setFetchTriggered(false); // Reset the flag after fetch
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (keyword.trim()) {
      setQuery(keyword.trim());
      navigate(`/search?q=${keyword.trim()}&type=${type}`, {
        state: { results: [] },
      });
      setFetchTriggered(true);
    }
  };

  useEffect(() => {
    if (stateResults.results?.length > 0) {
      setSearchResults(stateResults);
    } else if (fetchTriggered) {
      fetchSearchResults();
    }
  }, [stateResults, fetchTriggered]);

  const resultsArray = searchResults.results || [];

  // SearchResultsUserId & picturePath
  const searchResultsWithIds = resultsArray.map((result) => ({
    userId: result._id,
    picturePath: result.picturePath,
  }));

  // LoggedIn userId & picturePath
  const loggedInUserId = useSelector((state) => state.user._id);
  const loggedInPicturePath = useSelector((state) => state.user.picturePath);

  // Determine if the profile belongs to the logged-in user
  const isOwnProfile = resultsArray.map(
    (result) => result._id === loggedInUserId
  );

  const profilesWithImages = resultsArray.map((result, index) => {
    const propPicturePath = isOwnProfile[index]
      ? loggedInPicturePath
      : result.picturePath;
    return {
      ...result,
      propPicturePath,
    };
  });

  // Categories using counts from stateResults
  const categories = {
    user: `${searchResults.userCount || 0} Techxtrovert${
      searchResults.userCount === 1 ? "" : "s"
    }`,
    post: `${searchResults.postCount || 0} Post${
      searchResults.postCount === 1 ? "" : "s"
    } by Techxtroverts`,
    advert: `${searchResults.advertCount || 0} Sponsored Advert${
      searchResults.advertCount === 1 ? "" : "s"
    }`,
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {isLargeScreen && <Navbar />}
      {/* Drawer for Sidebar (Visible only on small screens) */}
      {isSmallScreen && (
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          PaperProps={{
            sx: {
              width: "250px",
              padding: "1rem",
            },
          }}
        >
          {/* Close Icon inside the Drawer */}
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Drawer Contents */}
          <Box display="flex" flexDirection="column">
            <TextField
              variant="outlined"
              fullWidth
              value={keyword}
              placeholder="Search"
              sx={{ mb: 2 }}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              fullWidth
            >
              <MenuItem value="user">Users</MenuItem>
              <MenuItem value="post">Posts</MenuItem>
              <MenuItem value="advert">Adverts</MenuItem>
            </Select>
            <Button
              sx={{ mt: 2, p: 1.5, borderRadius: "50px" }}
              onClick={handleSearch}
            >
              Search
            </Button>

            <Button sx={{ mt: 42 }} onClick={() => navigate("/home")}>
              Go Back Home
            </Button>
          </Box>
        </Drawer>
      )}

      {/* Toggle Sidebar Drawer (Small Screens) */}
      {isSmallScreen && !drawerOpen && (
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 1000,
            backgroundColor: "white",
            boxShadow: 2,
            borderRadius: "50%",
            p: 1,
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, rotate: -90 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          minHeight="80vh"
          p={3}
        >
          {/* Sidebar (Hidden on Small Screens) */}
          {!isSmallScreen && (
            <Box width="20%" pr={2} display={{ xs: "none", sm: "block" }}>
              {/* Original Sidebar Content */}
              <TextField
                variant="outlined"
                fullWidth
                value={keyword}
                placeholder="Search"
                sx={{ mb: 2 }}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                fullWidth
              >
                <MenuItem value="user">Users</MenuItem>
                <MenuItem value="post">Posts</MenuItem>
                <MenuItem value="advert">Adverts</MenuItem>
              </Select>
              <Button
                sx={{ mt: 2, p: 1.5, borderRadius: "50px" }}
                onClick={handleSearch}
              >
                Search
              </Button>
              <Button sx={{ mt: 2 }} onClick={() => navigate("/home")}>
                {" "}
                {/* Adjusted margin */}
                Go Back Home
              </Button>
            </Box>
          )}

          {/* Main Content Area */}
          <Box
            width={isSmallScreen ? "100%" : "80%"}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "2rem",
              backgroundColor: background,
              color: theme.palette.text.primary,
            }}
          >
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "80vh",
                  width: "100%",
                  backgroundColor: background,
                }}
              >
                <CircularProgress />
              </Box>
            ) : resultsArray.length > 0 ? (
              <>
                <Typography variant="h4" align="center" sx={{ mb: 4 }}>
                  {type === "user"
                    ? categories.user
                    : type === "post"
                    ? categories.post
                    : type === "advert"
                    ? categories.advert
                    : "All Categories"}
                </Typography>
                <Typography variant="h5" mb={3}>
                  Search Results for "{query || keyword}"
                </Typography>

                {/* Results */}
                <Box
                  sx={{
                    display: "flex",
                    overflowX: "auto",
                    scrollBehavior: "smooth",
                    gap: "1rem",
                    padding: "1rem 0",
                    maxWidth: "90%",
                    margin: "0 auto",
                  }}
                  component={motion.div}
                  initial={{ x: -100 }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {profilesWithImages.map((profile, index) => (
                    <Box
                      key={index}
                      sx={{
                        ...cardStyle,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        backgroundColor: alt,
                        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        minWidth: "250px",
                        transition: "transform 0.3s ease",
                        "&:hover": {
                          transform: "scale(1.05)",
                          boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.15)",
                        },
                      }}
                    >
                      <UserImage
                        propPicturePath={profile.propPicturePath} // Correctly pass the propPicturePath from profilesWithImages
                        size="90px"
                      />
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", color: dark }}
                      >
                        {profile.firstName} {profile.lastName}
                      </Typography>
                      <Typography
                        sx={{
                          color: dark,
                          marginBottom: "0.5rem",
                        }}
                      >
                        {profile.location}
                      </Typography>
                      {profile.description && (
                        <Typography
                          sx={{
                            fontSize: "0.9rem",
                            textAlign: "center",
                            marginBottom: "1rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: (theme) =>
                              theme.palette.mode === "dark"
                                ? "#00B8D4"
                                : "#004E72",
                          }}
                        >
                          {profile.description.slice(0, 20)}
                          {profile.description.length > 20 && "..."}
                        </Typography>
                      )}
                      <Button
                        variant="contained"
                        color="primary"
                        sx={{
                          backgroundColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "#00FFFF"
                              : "#00B8D4",
                          color: (theme) =>
                            theme.palette.mode === "dark"
                              ? "#000000"
                              : "#ffffff",
                          "&:hover": {
                            backgroundColor: (theme) =>
                              theme.palette.mode === "dark"
                                ? "#00CED1"
                                : "#0097A7",
                          },
                        }}
                        onClick={() =>
                          navigate(`/profile/${profile._id}`, {
                            state: { profile },
                          })
                        }
                      >
                        View Profile
                      </Button>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Typography
                variant="h6"
                sx={{ textAlign: "center", width: "100%", marginTop: "2rem" }}
              >
                No results found for "{keyword}".
              </Typography>
            )}
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
};

export default SearchPage;
