import { Avatar, Box, Typography } from "@mui/material";

const UserCard = ({ user, onClick }) => {
  const { firstName, lastName, location, picturePath } = user;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        p: 2,
        gap: 2,
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        ":hover": { cursor: "pointer", backgroundColor: "#f0f0f0" },
      }}
    >
      <Avatar src={picturePath} alt={`${firstName} ${lastName}`} />
      <Box>
        <Typography variant="h6">
          {firstName} {lastName}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {location}
        </Typography>
      </Box>
    </Box>
  );
};

export default UserCard;
