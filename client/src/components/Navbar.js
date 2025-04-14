import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Navbar({ token, setToken }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const userId = token ? jwtDecode(token).userId : null;

  useEffect(() => {
    if (token && userId) {
      const decodedToken = jwtDecode(token);
      const tokenUsername =
        decodedToken.username || decodedToken.name || decodedToken.user || null;
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

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);
  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <div className="navbar">
      <div className="nav-brand">
        <Link to={"/"}>
          <h1>Let's Chat</h1>
          <i className="bx bxs-message-alt"></i>
        </Link>
      </div>
      <div className="nav-user">
        {token ? (
          <h3>
            Welcome, <span>{username}</span>
          </h3>
        ) : null}
      </div>

      <div className="hamburger" onClick={toggleMenu}>
        &#9776;
      </div>

      <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
        {token ? (
          <>
            <li>
              <Link to="/" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to={`/chat/private/${userId}`}
                onClick={() => setMenuOpen(false)}
              >
                Chats
              </Link>
            </li>
            <li>
              <Link to="/groups" onClick={() => setMenuOpen(false)}>
                Groups
              </Link>
            </li>
            <li>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                Profile
              </Link>
            </li>
            <li>
              <Link>
                <i
                  id="theme"
                  className={`bx ${isDark ? "bx-sun" : "bx-moon"} theme-toggle`}
                  onClick={toggleTheme}
                  title="Toggle Dark Theme"
                ></i>
              </Link>
            </li>
            <button onClick={handleLogout} className="logout-btn-li">
              Logout
            </button>
          </>
        ) : (
          <>
            <li>
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
            </li>
            <li>
              <Link>
                <i
                  id="theme"
                  className={`bx ${isDark ? "bx-sun" : "bx-moon"} theme-toggle`}
                  onClick={toggleTheme}
                  title="Toggle Dark Theme"
                ></i>
              </Link>
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
