import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Navbar({ token, setToken }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User"); 
  const userId = token ? jwtDecode(token).userId : null;

  useEffect(() => {
    if (token && userId) {
      const decodedToken = jwtDecode(token);
      const tokenUsername = decodedToken.username || decodedToken.name || decodedToken.user || null;
      if (tokenUsername) {
        setUsername(tokenUsername);
      } else {
        // Fetch username from backend if not in token
        axios
          .get(`http://localhost:5000/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((response) => {
            setUsername(response.data.username || "User");
          })
          .catch((err) => {
            console.error("Failed to fetch username:", err);
            setUsername("User"); // Fallback
          });
      }
    }
  }, [token, userId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  return (
    <div className="navbar">
      <div className="nav-brand">
        <h1>Let's Chat</h1>
      </div>
      <div className="nav-user">
        {token ? <h3>Welcome, <span>{username}</span></h3> : null}
      </div>
      <ul className="nav-links">
        {token ? (
          <>
            <li>
              <Link to="/">Dashboard</Link>
            </li>
            <li>
              <Link to="/pending">Chats</Link>
            </li>
            <li>
              <Link to="/pending">Groups</Link>
            </li>
            <li>
              <Link to="/profile">Profile</Link>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
      </ul>
      <div className="nav-user">
        {token ? (
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default Navbar;