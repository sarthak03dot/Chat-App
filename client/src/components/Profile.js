import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
const API = process.env.REACT_APP_API;

function Profile({ token }) {
  const userId = jwtDecode(token).userId;
  const [userData, setUserData] = useState({ username: '', email: '' });
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await axios.get(`${API}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData({ username: data.username || 'Unknown', email: data.email || '' });
        setNewUsername(data.username || '');
      } catch (err) {
        setError('Failed to fetch user data: ' + (err.response?.data?.message || err.message || 'Unknown error'));
        console.error('Fetch user data error:', err);
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserData((prev) => ({ ...prev, username: newUsername }));
      setSuccess(data.message || 'Username updated successfully!');
      setError('');
      setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
    } catch (err) {
      setError('Failed to update username: ' + (err.response?.data?.message || err.message || 'Server error'));
      console.error('Update username error:', err);
      setSuccess('');
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
      setNewPassword('');
      setSuccess(data.message || 'Password updated successfully!');
      setError('');
      setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
    } catch (err) {
      setError('Failed to update password: ' + (err.response?.data?.message || err.message || 'Server error'));
      console.error('Update password error:', err);
      setSuccess('');
    }
  };

  return (
    <div className="profile-content">
      <h2>Profile</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="profile-info">
        <p><strong>User ID:</strong> {userId}</p>
        <p><strong>Username:</strong> {userData.username}</p>
        <p><strong>Email:</strong> {userData.email || 'Not provided'}</p>
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