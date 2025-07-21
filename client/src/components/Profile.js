import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Avatar,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
} from "@mui/material";
import { PhotoCamera, Save } from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const API = process.env.REACT_APP_API;

// Styled components for custom styling
const ProfileContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: "800px",
  margin: "0 auto",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const ProfilePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
}));

const ProfileCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
}));

const FormBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  borderRadius: theme.shape.borderRadius,
}));

function Profile({ token }) {
  const userId = jwtDecode(token).userId;
  const [userData, setUserData] = useState({
    username: "Unknown",
    email: "Unknown",
    phone: "",
    profile: "No Profile",
  });
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await axios.get(`${API}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData({
          username: data.username || "Unknown",
          email: data.email || "",
          phone: data.phone || "",
          profile: data.profile || "",
        });
        setNewUsername(data.username || "");
      } catch (err) {
        setError(
          "Failed to fetch user data: " +
            (err.response?.data?.message || err.message || "Unknown error")
        );
        console.error("Fetch user data error:", err);
      }
    };
    fetchUserData();
  }, [token, userId]);

  // Update username
  const updateUsername = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(
        `${API}/api/users/${userId}`,
        { username: newUsername },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setUserData((prev) => ({ ...prev, username: newUsername }));
      setSuccess(data.message || "Username updated successfully!");
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        "Failed to update username: " +
          (err.response?.data?.message || err.message || "Server error")
      );
      console.error("Update username error:", err);
      setSuccess("");
    }
  };

  // Update password
  const updatePassword = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(
        `${API}/api/users/${userId}`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewPassword("");
      setSuccess(data.message || "Password updated successfully!");
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        "Failed to update password: " +
          (err.response?.data?.message || err.message || "Server error")
      );
      console.error("Update password error:", err);
      setSuccess("");
    }
  };

  // Profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedProfile(file);
    }
  };

  const updateProfilePicture = async (e) => {
    e.preventDefault();
    if (!selectedProfile) {
      setError("Please select an image to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("profile", selectedProfile);

    try {
      const { data } = await axios.put(
        `${API}/api/upload/${userId}/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUserData((prev) => ({ ...prev, profile: data.profile }));
      setSelectedProfile(null);
      e.target.reset();
      setSuccess("Profile picture updated successfully");
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        "Failed to update profile picture: " +
          (err.response?.data?.message || err.message)
      );
      setSuccess("");
    }
  };

  return (
    <ProfileContainer>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", mb: 3 }}>
        Profile
      </Typography>
      <ProfilePaper>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ProfileCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1">
                  <strong>User ID:</strong> {userId}
                </Typography>
                <Typography variant="body1">
                  <strong>Username:</strong> {userData.username}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {userData.email || "Not provided"}
                </Typography>
                <Typography variant="body1">
                  <strong>Phone:</strong> {userData.phone || "Not provided"}
                </Typography>
              </CardContent>
            </ProfileCard>
            <ProfileCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Profile Picture
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <Avatar
                    src={
                      userData.profile
                        ? `${API}${userData.profile.startsWith("/") ? "" : "/"}${userData.profile}`
                        : ""
                    }
                    alt={userData.username || "User"}
                    sx={{ width: 120, height: 120 }}
                  />
                  <FormBox component="form" onSubmit={updateProfilePicture}>
                    <TextField
                      type="file"
                      inputProps={{ accept: "image/*" }}
                      onChange={handleFileChange}
                      size="small"
                      sx={{ width: "auto" }}
                    />
                    <StyledButton
                      variant="contained"
                      color="primary"
                      type="submit"
                      startIcon={<PhotoCamera />}
                      disabled={!selectedProfile}
                    >
                      Update Profile
                    </StyledButton>
                  </FormBox>
                </Box>
              </CardContent>
            </ProfileCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ProfileCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Update Username
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <FormBox component="form" onSubmit={updateUsername}>
                  <TextField
                    fullWidth
                    label="New Username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                    required
                    size="small"
                    variant="outlined"
                  />
                  <StyledButton
                    fullWidth
                    variant="contained"
                    color="primary"
                    type="submit"
                    startIcon={<Save />}
                  >
                    Update Username
                  </StyledButton>
                </FormBox>
              </CardContent>
            </ProfileCard>
            <ProfileCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <FormBox component="form" onSubmit={updatePassword}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    size="small"
                    variant="outlined"
                  />
                  <StyledButton
                    fullWidth
                    variant="contained"
                    color="primary"
                    type="submit"
                    startIcon={<Save />}
                  >
                    Change Password
                  </StyledButton>
                </FormBox>
              </CardContent>
            </ProfileCard>
          </Grid>
        </Grid>
      </ProfilePaper>
    </ProfileContainer>
  );
}

export default Profile;