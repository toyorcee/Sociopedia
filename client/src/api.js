import axios from 'axios';

// Create Axios instance
const api = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Ensure cookies are sent with the request
});

// Add the token to every request if available (from cookies or localStorage)
// api.interceptors.request.use(
//   (config) => {
//     let token = localStorage.getItem("token"); // First, try getting from localStorage
    
//     // If token not found in localStorage, check cookies
//     if (!token) {
//       token = document.cookie.split(";").find(cookie => cookie.trim().startsWith("token="));
//       token = token ? token.split("=")[1] : null; // Extract token value from cookies
//     }

//     // If token is found, add it to the headers
//     if (token) {
//       config.headers["Authorization"] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// Handle response errors (token expiry handling, etc.)
api.interceptors.response.use(
  (response) => response, // Pass through successful response
  (error) => {
    if (error.response && error.response.status === 403) {
      // Token expired or invalid, handle logout
      localStorage.removeItem("token"); // Remove token from localStorage
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"; // Remove token cookie
      window.location.href = "/"; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default api;
