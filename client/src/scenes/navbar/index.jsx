import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  useMediaQuery,
  Modal,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import {
  Search,
  Message,
  DarkMode,
  LightMode,
  Notifications,
  Help,
  Menu,
  Close,
} from "@mui/icons-material";
import AdvertForm from "../../Forms/AdvertForm";
import { useDispatch, useSelector } from "react-redux";
import { setMode, setLogout } from "state";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import debounce from "lodash/debounce";
import { toast } from "react-toastify";

const Navbar = () => {
  const [isMobileMenuToggled, setIsMobileMenuToggled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const resultsArray = searchResults.results || [];
  const defaultAvatar =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);

  const loggedInUserId = useSelector((state) => state.user._id);
  const loggedInPicturePath = useSelector((state) => state.user.picturePath);

  // Fetch cached image from Redux using dynamic key
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");

  const theme = useTheme();
  const neutralLight = theme.palette.neutral.light;
  const dark = theme.palette.neutral.dark;
  const background = theme.palette.background.default;
  const primaryLight = theme.palette.primary.light;
  const alt = theme.palette.background.alt;

  const firstName = `${user.firstName}`;

  // Search Function with Logs
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const url = `https://sociopedia-6tzx.onrender.com/search?keyword=${query}&type=${
        type || ""
      }&page=1&limit=9`;

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

  const debouncedSearch = useCallback(debounce(performSearch, 500), [type]);

  const handleKeywordChange = (e) => {
    const query = e.target.value;
    setKeyword(query);
    debouncedSearch(query);
  };

  const categorizedResults = {
    users: resultsArray.filter((res) => res.type === "user").slice(0, 3),
    posts: resultsArray.filter((res) => res.type === "post").slice(0, 3),
    adverts: resultsArray.filter((res) => res.type === "advert").slice(0, 3),
  };

  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  return (
    <FlexBetween padding="1rem 6%" backgroundColor={alt}>
      <FlexBetween gap="1.75rem">
        <Typography
          fontWeight="bold"
          fontSize="clamp(1rem, 2rem, 2.25rem)"
          color="primary"
          onClick={() => navigate("/home")}
          mr={16.5}
          sx={{
            "&:hover": {
              cursor: "pointer",
            },
          }}
        >
          Sociopedia
        </Typography>

        {/* Desktop Search Bar */}
        {isNonMobileScreens && (
          <Box position="relative">
            <FlexBetween
              backgroundColor={neutralLight}
              borderRadius="9px"
              gap="1rem"
              padding="0.1rem 1.5rem"
            >
              <InputBase
                placeholder="Search..."
                value={keyword}
                onChange={handleKeywordChange}
              />
              <IconButton onClick={() => performSearch(keyword)}>
                <Search />
              </IconButton>
            </FlexBetween>

            {/* Dropdown Search Results */}
            {keyword.trim() && resultsArray.length > 0 && (
              <Box
                position="absolute"
                top="100%"
                left="0"
                zIndex="20"
                width="100%"
                maxHeight="300px"
                overflow="auto"
                backgroundColor={neutralLight}
                borderRadius="0.25rem"
                boxShadow={3}
                padding="0.5rem"
                mt={1}
              >
                {/* Display search results */}
                {resultsArray.length === 1 ? (
                  // Single result - Navigate to corresponding page
                  <Box
                    key={resultsArray[0]._id}
                    display="flex"
                    alignItems="center"
                    padding="0.5rem"
                    sx={{
                      "&:hover": {
                        backgroundColor: primaryLight,
                        cursor: "pointer",
                      },
                    }}
                    onClick={() => {
                      const result = resultsArray[0];
                      console.log("Selected result:", result); // Log the selected result
                      if (result.firstName && result.lastName) {
                        navigate(`/profile/${result?._id}`); // User profile
                      } else if (result.picturePath) {
                        navigate(`/profile/${result?.userId}`); // Post - user profile
                      } else if (result.adPicturePath) {
                        navigate(`/advert/${result?._id}`); // Advert page
                      }
                    }}
                  >
                    <img
                      src={
                        resultsArray[0]?.picturePath ||
                        resultsArray[0]?.adPicturePath ||
                        defaultAvatar
                      }
                      alt="Result"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        marginRight: "10px",
                      }}
                    />
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {resultsArray[0]?.firstName
                        ? `${resultsArray[0]?.firstName} ${resultsArray[0]?.lastName}`
                        : resultsArray[0]?.companyName ||
                          resultsArray[0]?.title}
                    </Typography>
                  </Box>
                ) : (
                  // Multiple results - Show 'View X results'
                  <Typography
                    variant="subtitle1"
                    sx={{
                      cursor: "pointer",
                      textDecoration: "underline",
                      marginBottom: "0.5rem",
                      textAlign: "center",
                      display: "block",
                    }}
                    onClick={() => {
                      console.log(
                        "Sending searchResults in state:",
                        searchResults
                      ); // Log what's being sent
                      navigate(`/search?q=${keyword}`, {
                        state: { results: searchResults },
                      });
                    }}
                  >
                    View {resultsArray.length} results
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </FlexBetween>

      {/* DESKTOP NAV */}
      {isNonMobileScreens ? (
        <FlexBetween gap="2rem">
          <IconButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === "dark" ? (
              <DarkMode sx={{ fontSize: "25px" }} />
            ) : (
              <LightMode sx={{ color: dark, fontSize: "25px" }} />
            )}
          </IconButton>
          <Message sx={{ fontSize: "25px" }} />
          <Notifications sx={{ fontSize: "25px" }} />
          <Help sx={{ fontSize: "25px" }} />
          <FormControl variant="standard" value={firstName}>
            <Select
              value={firstName}
              sx={{
                backgroundColor: neutralLight,
                width: "150px",
                borderRadius: "0.25rem",
                p: "0.25rem 1rem",
                "& .MuiSelect-select:focus": {
                  backgroundColor: neutralLight,
                },
              }}
              input={<InputBase />}
            >
              <MenuItem value={firstName}>
                <Typography>{firstName}</Typography>
              </MenuItem>
              {user.isAdmin && (
                <MenuItem
                  onClick={toggleModal}
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  Create Ad
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  dispatch(setLogout());
                  toast.success("Logged out successfully!");
                }}
              >
                Log Out
              </MenuItem>
            </Select>
          </FormControl>
        </FlexBetween>
      ) : (
        <IconButton
          onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
        >
          <Menu />
        </IconButton>
      )}

      {/* MOBILE NAV */}
      {!isNonMobileScreens && isMobileMenuToggled && (
        <Box
          position="fixed"
          right="0"
          bottom="0"
          height="100%"
          zIndex="10"
          maxWidth="500px"
          minWidth="300px"
          backgroundColor={background}
        >
          {/* Mobile Search Bar */}
          <Box
            backgroundColor={neutralLight}
            borderRadius="9px"
            padding="0.5rem 1rem"
            display="flex"
            alignItems="center"
            gap="1rem"
            marginBottom="1rem"
          >
            <InputBase
              placeholder="Search..."
              value={keyword}
              onChange={handleKeywordChange}
            />
            <IconButton onClick={() => performSearch(keyword)}>
              <Search />
            </IconButton>
          </Box>

          {/* Dropdown Search Results */}
          {keyword.trim() && resultsArray.length > 0 && (
            <Box
              maxHeight="300px"
              overflow="auto"
              backgroundColor={neutralLight}
              borderRadius="0.25rem"
              boxShadow={3}
              padding="1rem"
            >
              {Object.entries(categorizedResults).map(
                ([category, results]) =>
                  results.length > 0 && (
                    <Box key={category} marginBottom="1rem">
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ textTransform: "capitalize" }}
                      >
                        {category} ({results.length} results)
                      </Typography>
                      {results.map((result, index) => (
                        <Card
                          key={index}
                          sx={{
                            margin: "0.5rem 0",
                            ":hover": { boxShadow: 6, cursor: "pointer" },
                          }}
                        >
                          <CardContent>
                            <Typography>
                              {result.firstName || result.title}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )
              )}
            </Box>
          )}

          {/* CLOSE ICON */}
          <Box display="flex" justifyContent="flex-end" p="1rem">
            <IconButton
              onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
            >
              <Close />
            </IconButton>
          </Box>

          {/* MENU ITEMS */}
          <FlexBetween
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            gap="3rem"
          >
            <IconButton onClick={() => dispatch(setMode())}>
              {theme.palette.mode === "dark" ? (
                <DarkMode sx={{ fontSize: "25px" }} />
              ) : (
                <LightMode sx={{ color: dark, fontSize: "25px" }} />
              )}
            </IconButton>
            <Message sx={{ fontSize: "25px" }} />
            <Notifications sx={{ fontSize: "25px" }} />
            <Help sx={{ fontSize: "25px" }} />
            <FormControl variant="standard" value={firstName}>
              <Select
                value={firstName}
                sx={{
                  backgroundColor: neutralLight,
                  width: "150px",
                  borderRadius: "0.25rem",
                  p: "0.25rem 1rem",
                }}
                input={<InputBase />}
              >
                <MenuItem value={firstName}>
                  <Typography>{firstName}</Typography>
                </MenuItem>
                {user.isAdmin && (
                  <MenuItem onClick={toggleModal}>Create Ad</MenuItem>
                )}
                <MenuItem onClick={() => dispatch(setLogout())}>
                  Log Out
                </MenuItem>
              </Select>
            </FormControl>
          </FlexBetween>
        </Box>
      )}

      {/* Advert Form Modal */}
      {isModalOpen && (
        <AdvertForm isOpen={isModalOpen} handleClose={toggleModal} />
      )}

      {/* Search Results Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <h2>Search Results</h2>
          {resultsArray.length === 0 ? (
            <p>No results found.</p>
          ) : (
            resultsArray.map((result, index) => (
              <Card
                key={index}
                sx={{ ":hover": { boxShadow: 6, cursor: "pointer" } }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={result.picturePath || "/placeholder.png"}
                  alt={result.firstName || "Post Image"}
                />
                <CardContent>
                  <Typography>
                    {result.firstName || result.description}
                  </Typography>
                  <Typography variant="body2">{result.location}</Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </Modal>
    </FlexBetween>
  );
};

export default Navbar;
