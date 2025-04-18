import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
const API = process.env.REACT_APP_API;

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
          phone : data.phone || "",
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
      setTimeout(() => setSuccess(""), 3000); // Clear success message after 3 seconds
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
      setTimeout(() => setSuccess(""), 3000); // Clear success message after 3 seconds
    } catch (err) {
      setError(
        "Failed to update password: " +
          (err.response?.data?.message || err.message || "Server error")
      );
      console.error("Update password error:", err);
      setSuccess("");
    }
  };

  // profile

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
    <div className="profile-content">
      <h2>Profile</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="profile-info">
        <div>
          <p>
            <strong>User ID:</strong> {userId}
          </p>
          <p>
            <strong>Username:</strong> {userData.username}
          </p>
          <p>
            <strong>Email:</strong> {userData.email || "Not provided"}
          </p>{" "}
          <p>
            <strong>Phone:</strong> {userData.phone || "Not provided"}
          </p>
        </div>
        <div className="profile-img ">
          <img
            src={
              userData.profile
                ? `${API}${userData.profile.startsWith("/") ? "" : "/"}${
                    userData.profile
                  }`
                : ""
            }
            alt={userData.username || "User"}
          />
          <form onSubmit={updateProfilePicture} className="profile-form">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            <button type="submit">Update Profile</button>
          </form>
        </div>
      </div>

      <form onSubmit={updateUsername} className="profile-form">
        <h3>Update Username</h3>
        <div className="form-group">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="New Username"
            required
          />
        </div>
        <button type="submit">Update Username</button>
      </form>

      <form onSubmit={updatePassword} className="profile-form">
        <h3>Change Password</h3>
        <div className="form-group">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            required
          />
        </div>
        <button type="submit">Change Password</button>
      </form>
    </div>
  );
}

export default Profile;
